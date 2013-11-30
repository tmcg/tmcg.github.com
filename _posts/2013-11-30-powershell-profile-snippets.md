--- 
layout: post
title: "Powershell Profile Snippets"
date: 2013-11-30T21:45+10:00
---

I have an admission to make - I've been a command line junkie for a long time now.

When PowerShell first came along I had a healthy skepticism about how much care and feeding it would enjoy in the Windows GUI landscape. I said a couple of things to myself:

- "I'll just give it try for a month or two."
- "I can always switch back to Cygwin and cmd if I don't like it."

I'm so happy any doubts were proved unfounded and I haven't ever looked back.

Since those early days of v1.0, PowerShell has grown into a mature and robust command line ecosystem. I find that it's now an essential tool to get the job done. Batch files don't cut it any longer for someone like me at the intersection of development and administration.

If you develop software or automate tasks on the Windows platform and haven't tried it yet, go for it!
The [Windows PowerShell Survival Guide](http://social.technet.microsoft.com/wiki/contents/articles/183.windows-powershell-survival-guide.aspx) has just about every resource you could need to dive in.

----------

### Customising My Profile
No shell is perfect without a little customisation. I wouldn't recommended using these snippets within PowerShell script files, but they do make the interactive experience much more pleasant.

[Add these functions and aliases to your PowerShell profile](http://www.howtogeek.com/50236/) if they look useful.

### Filtering
These two functions quickly filter files or folders. More generally, they filter *containers*, which means that they will work the same way in the file system provider as they do in other providers (e.g. IIS:\ and SQLSERVER:\ drives from the WebAdministration and SQLPS modules respectively).

Since PowerShell v3, the Get-ChildItem (ls) cmdlet has -file and -directory switches so these functions aren't as helpful as they once were, but when I'm thinking in terms of pipelines they're still useful.

    function Where-Container($Input) { 
        $Input | Where-Object {$_.PsIsContainer} 
    }

    function Where-NotContainer($Input) {
        $Input | Where-Object {-not $_.PsIsContainer}
    }
	
	Set-Alias whc Where-Container
	Set-Alias whnc Where-NotContainer

e.g. Listing all folders, then all files:
	
	>% ls C:\ | whc

    Directory: C:\

	Mode                LastWriteTime     Length Name
	----                -------------     ------ ----
	d----         9/02/2013     23:30            inetpub
	d-r--        26/11/2013     18:00            Program Files
	d-r--        29/11/2013     21:45            Program Files (x86)
	d----        27/11/2013     22:27            Tools
	d-r--        23/02/2013     23:33            Users
	d----        24/11/2013     21:29            Windows


	>% ls C:\ | whnc

    Directory: C:\

	Mode                LastWriteTime     Length Name
	----                -------------     ------ ----
	-a---         7/10/2012     00:00       1024 .rnd

### Selecting and Grouping
Sometimes I only want a small sample of the pipeline or quickly get the aggregation value of some property. The Measure-Object and Group-Object cmdlets are always available for complex scenarios, but these function cover some common use cases.

	function Select-First([int] $n=10) {
	    $Input | Select-Object -first $n
	}
	
	function Sum-Object([string] $property) {
	    ($Input | Measure-Object $property -sum).Sum
	}
	
	function Count-Object($Input) {
		($Input | Measure-Object).Count
	}

	Set-Alias sf Select-First
	Set-Alias sum Sum-Object
	Set-Alias count Count-Object

e.g. Using Get-Process (ps), find the Top 3 processes by working memory. How much are they using in total? How many Chrome processes are running?

	>% $p = ps | sort WorkingSet64 -desc | sf 3
	>% $p | select Name,WorkingSet64 | ft

	Name     WorkingSet64
	----     ------------
	sqlservr    233582592
	chrome      185348096
	chrome       80498688
	

	>% $p | sum WorkingSet64
	499429376

    >% ps | where Name -eq 'chrome' | count
    21


### Search
A few years ago it was sad to see the [Google Desktop](http://en.wikipedia.org/wiki/Google_Desktop) product shelved. The Ctrl-Ctrl hotkey was a tough habit to break. Now there's quick Googling from the command line!

	function Search-Google()
	{
	    $query = [System.Uri]::EscapeDataString($args);
	    $url = "http://www.google.com/search?q=$query";
	    start $url
	}
	
	function Search-GoogleLucky()
	{
	    $query = [System.Uri]::EscapeDataString($args); 
	    $url = "http://www.google.com/search?q=$query&btnI=1"; 
	    start $url
	}

    Set-Alias gg Search-Google
    Set-Alias ggl Search-GoogleLucky

e.g. 

	>% ggl tagged powershell site:stackoverflow.com


### Environment
My profile is used on a number of machines, some 32-bit, others 64-bit. I find that it's useful to print a message when the session starts to indicate whether the 32 or 64 bit PowerShell executable has been launched.

	function Get-CpuArch {
	    $arch = if($env:Processor_Architecture -like '*64*') {'x64'} else {'x86'}
	    Write-Output "Windows PowerShell ($arch)"
	}
	Write-Host (Get-CpuArch)

In addition to architecture portability some legacy snap-ins I use only support 32-bit PowerShell, or they may not be installed at all. They're loaded on demand and only if available, as they're used relatively infrequently.

	# Import Available Snap-Ins
	function Import-LegacySnapIns {
		$s = ('Microsoft.TeamFoundation.PowerShell','WebAdministration')
		Get-PsSnapin -registered | 
	    	Where-Object { $_.Name -in $s } |
    		ForEach-Object { Add-PsSnapin $_.Name }
	}


### Interactive Prompt
I prefer a minimalist approach to the actual prompt. Displaying the CPU architecture and current directory into the console title is handy as well, though doesn't always work on non-standard applications hosting the PowerShell runspace:

	function Prompt 
	{
	    if ($host.Name -in ('ConsoleHost','Windows PowerShell ISE Host')) {
	        # Put the current directory into the window title
	        $host.UI.RawUI.WindowTitle = "$(Get-CpuArch) -  $(Get-Location)"; 
	    }
	    ">% "
	}

