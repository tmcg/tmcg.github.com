--- 
layout: post
title: "PowerShell Tricks - Starting Without a Console Window"
date: 2013-12-04T21:10+10:00
icon: "/assets/img/powershell-80x80.png"
tags: [powershell]
---

Running an unattended PowerShell script or command on a recurring schedule is a technique that can be quite useful. The task might involve capturing some performance data, sending an alert, or cleaning up some leftover files.
<!--more-->
Once a script is written, it's easy enough to set up a scheduled task and pass it to PowerShell.exe with the -WindowStyle Hidden and -File parameters. The problem with this method is that the console window starts up with a small flash that can be disruptive/annoying if the computer is in use at the time.
 
Python on Windows solves this problem by having two separate executables (python.exe and pythonw.exe). The latter starts a Python instance that suppresses the console window, running the code in the background.

I wanted something similar for PowerShell.

While it's certainly possible to write an application in C# perhaps that hosts the PowerShell runtime without a console window, going to that length felt like overkill. The solution that I found the most workable involved adapting some old VBScript to pass the required parameters through to the real PowerShell:

    ' PowerShellW.vbs - Runs Powershell with no console window
    Dim objShell
    
    If WScript.Arguments.Length = 0 Then
        WScript.Echo "No arguments specified"
        WScript.Quit
    End If
    
    strCmd = "powershell.exe -NoLogo -NonInteractive"
    
    For Each strArg in WScript.Arguments
        If Left(strArg,1) = "-" Then
            strCmd = strCmd & " " & strArg
        Else 
            strCmd = strCmd & " " & Chr(34) & strArg & Chr(34)
        End If
    Next
    
    Set objShell = CreateObject("WScript.Shell")
    objShell.Run strCmd,0

Usage 1: Execute a script in the background

    powershellw -NoProfile -File C:\Scripts\YourScriptName.ps1

Usage 2: Restart a group of services
 
    powershellw -Command "Restart-Service YourServiceName*"

