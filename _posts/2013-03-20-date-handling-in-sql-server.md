--- 
layout: post
title: "Date Handling In SQL Server"
date: 2013-03-20T23:34+10:00
---

My daily tasks often involve designing reports and providing business users with requested report data via ad-hoc queries. This means getting well acquainted with date handling in Microsoft SQL Server.

Below is a list of some common date handling tips for SQL Server queries. Many of these tips are explained in greater detail in [The Ultimate Guide to the DateTime Data Types](http://www.karaszi.com/sqlserver/info_datetime.asp). That guide also explains the best ways to represent literal date values to avoid problems with regional settings and why to avoid using BETWEEN in date range queries.

### Date Truncation

Consider the case of a client application passing a date range (e.g. start & end dates) to a reporting stored procedure. If the procedure has parameters of type DATETIME or SMALLDATETIME occasionally bugs can occur where the application accidentally passes a time value in addition to causing subtle reporting errors that manifest differently depending on the time of day the procedure is run.

Where possible, a solution for this problem might be to restrict the data type of the parameters to the DATE type rather than DATETIME or SMALLDATETIME. What about when supporting legacy systems still on SQL Server 2000 where the DATE type is not available? Date truncation inside the procedure can be used to guard against errors in this scenario.

To truncate a datetime value to the nearest date:

    DECLARE @D1 DATETIME; 
    SELECT @D1 = '20120520 22:28:42';
    
    SELECT @D1 [OriginalDate], DATEADD(DAY,DATEDIFF(DAY,0,@D1),0) [TruncatedDate];
    /*
    OriginalDate            TruncatedDate
    ----------------------- -----------------------
    2012-05-20 22:28:42.000 2012-05-20 00:00:00.000
    */

Some applications may have a user defined function (UDF) that performs this task, for example:

    SELECT dbo.FN_TRUNC_DATE('20120520 22:28:42');
    /*
    TruncatedDate
    -----------------------
    2012-05-20 00:00:00.000
    */

My general rule when reporting over a single day or range of days is to use the DATE type if available. When not possible I prefer the DATEADD/DATEDIFF method of date truncation instead of UDFs or other methods of truncating a date such as using [CAST and CONVERT](http://msdn.microsoft.com/en-us/library/ms187928.aspx) with formatting code 112. 

All methods are fine for truncating a single date. When used over large data sets however, calling functions on date values (both in built functions or UDFs) have the potential to cause performance issues by inhibiting sargability if used in a query WHERE clause for example.

### Interval Truncation & Rounding

This truncation logic can also be applied to other date/time intervals, such as years/quarters/months/weeks/hours or blocks of N minutes. The following query demonstrates how to round up or down to some nearest desired time intervals:

    -- Rounding time to nearest interval
    declare @d1 datetime, @nn tinyint
    select @d1 = '20120520 22:28:42', @nn = 20
    
    select '1a. Round down to Minute' [IntervalName],
        dateadd(mi,datediff(mi,0,@d1),0) [IntervalDate], null [Nth] union all 
    select '1b. Round up to Minute',
        dateadd(mi,1+datediff(mi,0,@d1),0), null union all 
    select '1c. Round to nearest Minute',
        cast(@d1 as smalldatetime), null union all
    select '2a. Round down to Nth Minute', -- StartIntervalMinute(N1): Round down to @nn minutes
        dateadd(mi,1.0*@nn*(datediff(mi,dateadd(hh,datediff(hh,0,@d1),0),@d1)/@nn),dateadd(hh,datediff(hh,0,@d1),0)), @nn union all
    select '2b. Round up to Nth Minute', -- StartIntervalMinute(N2): Round up to @nn minutes
        dateadd(mi,@nn+1.0*@nn*(datediff(mi,dateadd(hh,datediff(hh,0,@d1),0),@d1)/@nn),dateadd(hh,datediff(hh,0,@d1),0)), @nn union all
    select '3a. Round down to Hour',
        dateadd(hh,datediff(hh,0,@d1),0), null union all
    select '3b. Round up to Hour',
        dateadd(hh,1+datediff(hh,0,@d1),0), null union all
    select '4a. Round down to Day',
        dateadd(dd,datediff(dd,0,@d1),0), null union all
    select '4b. Round down to Day', -- (SQL2005+)
        cast(@d1 as date), null union all
    select '5. Round to start of Week', -- StartIntervalWeek always rounds to Monday as cast(0 as datetime) = 1/1/1900 is a Monday
        dateadd(wk,datediff(wk,0,@d1),0), null union all
    select '6. Round to start of Month',
        dateadd(mm,datediff(mm,0,@d1),0), null union all
    select '7. Round to start of Qtr',
        dateadd(qq,datediff(qq,0,@d1),0), null union all
    select '8. Round to start of Year',
        dateadd(yy,datediff(yy,0,@d1),0), null
    order by 1
    /*
    IntervalName                 IntervalDate            Nth
    ---------------------------- ----------------------- ----
    1a. Round down to Minute     2012-05-20 22:28:00.000 NULL
    1b. Round up to Minute       2012-05-20 22:29:00.000 NULL
    1c. Round to nearest Minute  2012-05-20 22:29:00.000 NULL
    2a. Round down to Nth Minute 2012-05-20 22:20:00.000 20
    2b. Round up to Nth Minute   2012-05-20 22:40:00.000 20
    3a. Round down to Hour       2012-05-20 22:00:00.000 NULL
    3b. Round up to Hour         2012-05-20 23:00:00.000 NULL
    4a. Round down to Day        2012-05-20 00:00:00.000 NULL
    4b. Round down to Day        2012-05-20 00:00:00.000 NULL
    5. Round to start of Week    2012-05-21 00:00:00.000 NULL
    6. Round to start of Month   2012-05-01 00:00:00.000 NULL
    7. Round to start of Qtr     2012-04-01 00:00:00.000 NULL
    8. Round to start of Year    2012-01-01 00:00:00.000 NULL
    */

### Week Day Number

Determining the day of the week a particular date falls on is made trickier because the DATEPART(dw, ...) function depends on the value of the DATEFIRST variable. The DATENAME function isn't reliable either because it depends on the connection LANGUAGE setting. 

Obtaining a consistent day number without altering LANGUAGE or DATEFIRST variables involves adding an offset (@@DATEFIRST) to the date before using the DATEPART function:

    -- Day number independent of @@DATEFIRST
    set nocount on
    declare @d1 datetime, @n int
    select @d1 = '20120519', @n = 1;
    
    while @n <= 7
    begin
        set @d1 = dateadd(day,1,@d1);
        set @n += 1;
    
        select @d1 [DateValue]
            , datename(dw, @d1) [DayOfWeekName]
            , datepart(dw, dateadd(day,@@datefirst,@d1)) [DayOfWeekNumber]
    end
    /*
    DateValue               DayOfWeekName   DayOfWeekNumber
    ----------------------- --------------- ---------------
    2012-05-20 00:00:00.000 Sunday          1
    2012-05-21 00:00:00.000 Monday          2
    2012-05-22 00:00:00.000 Tuesday         3
    2012-05-23 00:00:00.000 Wednesday       4
    2012-05-24 00:00:00.000 Thursday        5
    2012-05-25 00:00:00.000 Friday          6
    2012-05-26 00:00:00.000 Saturday        7
    */

### Month and Quarter IDs

Grouping data by month or quarter is made simpler when an OLAP date dimension table is available. There are a number of scripts available on the web to generate a table like this. In the past I've adapted a quite comprehensive and helpful example [date population script found here](http://jsimonbi.wordpress.com/2011/10/09/populating-your-date-dimension/).

Grouping data in a basic way by month or quarter in an ad-hoc query isn't too difficult if a time dimension isn't available though. A month or quarter integer identifier can be generated as an expression and perhaps used later in a table join.

The following queries use the [AdventureWorks Sample Database](http://msftdbprodsamples.codeplex.com/releases/view/55330) available for SQL Server 2012:

    -- Order Counts By Month
    select year(OrderDate)*100+month(OrderDate) [OrderMonthId]
    	, count(*) [OrderCount]
      from Sales.SalesOrderHeader
     where year(OrderDate) in (2007,2008)
     group by year(OrderDate)*100+month(OrderDate)
     order by year(OrderDate)*100+month(OrderDate)
    
    -- Order Counts By Quarter
    select year(OrderDate)*100+((month(OrderDate)-1)/3)+1 [OrderQuarterId]
    	, count(*) [OrderCount]
      from Sales.SalesOrderHeader
     where year(OrderDate) in (2007,2008)
     group by year(OrderDate)*100+((month(OrderDate)-1)/3)+1
     order by year(OrderDate)*100+((month(OrderDate)-1)/3)+1

    /*
    OrderMonthId OrderCount
    ------------ -----------
    200701       309
    200702       404
    200703       378
    200704       368
    200705       469
    200706       423
    200707       609
    200708       1760
    200709       1783
    200710       1779
    200711       1889
    200712       2272
    200801       1946
    200802       2032
    200803       2109
    200804       2128
    200805       2386
    200806       2374
    200807       976

    OrderQuarterId OrderCount
    -------------- -----------
    200701         1091
    200702         1260
    200703         4152
    200704         5940
    200801         6087
    200802         6888
    200803         976
    */

### Reporting Date Range Tables

A date range table can be useful when requirements dictate reporting at differing time granularity (perhaps specified by the user as a report parameter) or reporting on intervals that vary in length. Sometimes the different reporting periods may even overlap with each other.

This technique is powerful when combined with a numbers table to generate the reporting periods ([always have a numbers table!](http://sqlblog.com/blogs/adam_machanic/archive/2006/07/12/you-require-a-numbers-table.aspx)).

    IF OBJECT_ID('tempdb..#RptRanges') IS NOT NULL DROP TABLE #RptRanges
    GO
    create table #RptRanges
    (
        RangeId int primary key
        ,RangeName varchar(30)
        ,StartDate date
        ,EndDate date
    )
    GO
    
    DECLARE @CurrDate DATE = '20080307'
    
    INSERT #RptRanges (RangeId, RangeName, StartDate, EndDate)
    select 1,'Today',@CurrDate,@CurrDate union all
    select 2,'Yesterday',dateadd(day,-1,@CurrDate),dateadd(day,-1,@CurrDate) union all
    select 3,'WithinSevenDays',dateadd(day,-7,@CurrDate),dateadd(day,-1,@CurrDate) union all
    select 4,'WithinLastMonth',dateadd(month,-1,@CurrDate),dateadd(day,-1,@CurrDate) union all
    select 5,'WithinLastYear',dateadd(year,-1,@CurrDate),dateadd(day,-1,@CurrDate)
    
    select RangeName, StartDate, EndDate
      from #RptRanges
     order by RangeId
    
    select rr.RangeName
            , count(*) [OrderCount]
            , sum(o.TotalDue) [OrderValue]
            , avg(o.TotalDue) [OrderValueAvg]
      from Sales.SalesOrderHeader o
            inner join #RptRanges rr on o.OrderDate >= rr.StartDate and o.OrderDate < dateadd(day,1,rr.EndDate)
     group by rr.RangeId, rr.RangeName
     order by rr.RangeId, rr.RangeName
    
    /*
    RangeName       StartDate  EndDate
    --------------- ---------- ----------
    Today           2008-03-07 2008-03-07
    Yesterday       2008-03-06 2008-03-06
    WithinSevenDays 2008-02-29 2008-03-06
    WithinLastMonth 2008-02-07 2008-03-06
    WithinLastYear  2007-03-07 2008-03-06

    RangeName       OrderCount  OrderValue      OrderValueAvg
    --------------- ----------- --------------- ---------------
    Today           65          55272.853       850.3515
    Yesterday       54          33019.6226      611.4744
    WithinSevenDays 592         3435070.9537    5802.4847
    WithinLastMonth 1991        4649652.2129    2335.3351
    WithinLastYear  16077       51512733.0511   3204.1259
    */


I hope you'll find some or all of these tips useful!
