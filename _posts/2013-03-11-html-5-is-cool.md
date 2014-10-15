--- 
layout: post
title: "HTML 5 Is Cool"
date: 2013-03-11T20:52+10:00
icon: "/assets/img/html5-80x80.png"
tags: [html5,javascript]
---

Last year I took part in an interesting project called '50 Apps in 50 Weeks' to both sharpen the saw and become exposed to different platforms and languages.
<!--more-->
As it turns out a non-trivial application in unfamiliar languages each week on top of other commitments is a fairly brisk pace. Unfortunately neither I nor even the project itself ended up making it to the end of 50 weeks but it was definitely worth it to play around with JavaScript and an introduction to the new features of HTML5.

Here's a couple of the apps that I implemented during that time that I'm pretty happy with and now I have a chance to show off. Both are 100% client side, maximise your browser window for best effect. Enjoy!

---

### Snake

Like the old Nokia game that we've all played at some point. Hit the M key to turn the music off if that's not your thing.

Features:

- Canvas element
- Web Audio API
- Main loop uses [jQuery timer](https://github.com/jchavannes/jquery-timer)

<a href="/apps/snake" class="btn btn-primary">Play Snake</a> 

---

### Sticky Notes

Click on the palette to create a new note, double click to edit & drag a note to the trash bin to delete it.

Features:

- HTML5 Local Storage and [jQuery JSON](https://code.google.com/p/jquery-json/) for persistence
- CSS3 transforms & box shadows to jazz up the realism a little
- Draggables & Dialog boxes use [jQuery UI](http://www.jqueryui.com)

This one's pretty simple but there's also <a href="/apps/notes/stickynotes_collab.zip">a version that supports collaborative editing</a> by talking to a Python listen server that mediates between clients.

<a href="/apps/notes" class="btn btn-primary">Open Sticky Notes</a>

