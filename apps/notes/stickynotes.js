Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

function generateGuid() {
    var t = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return t.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16).toUpperCase();
    });
}

function debugMessage(msg) {
    console.log(msg);
}

function htmlEncode(s) {
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); 
}


function StickyWall() {
    this.notes = []
    this.noteColors = ["FFFF66","FFDD9D","FFBEE0","BCDEC5"] // Yellow,Orange,Pink,Green
    this.storageKey = "StickyNotesHtml5";
    this.initialize();
}

StickyWall.prototype.initialize = 
function() {
    var refWall = this;
    this.loadNotesFromStorage();

    this.noteForm = $("#sticky-note-form");

    var notepadIdPrefix = 'notepad';
    for(var colorIndex = 0; colorIndex < this.noteColors.length; colorIndex++) {
        debugMessage('StickyWall->initialize: Creating Notepad '+colorIndex);
        var notepadStyle = '';
        var foreColor = "#000000";
        var backColor = "#"+this.noteColors[colorIndex];
        notepadStyle += 'width:120px; font-size: smaller; height:40px;';
        notepadStyle += 'color:'+foreColor+'; background-color:'+backColor+';'
        var notepadId = notepadIdPrefix+colorIndex;

        var notepadHtml = '<div id="'+notepadId+'" style="'+notepadStyle+'"></div>';
        $('#sticky-notepad-tray').append(notepadHtml);
        $('#'+notepadId).click( function() { 
            var id = $(this).attr('id').substring(notepadIdPrefix.length);
            refWall.createNewNote('#000000','#'+refWall.noteColors[id]);
        });
    }

    $('#trash-can').droppable({
        accept: '.sticky-note',
        drop: function (event, item) {
            if(confirm('Delete this note?')) {
                var $element = item.draggable;
                refWall.removeNote($element.attr('id'));
            }
        }
    });
    
    this.noteForm.dialog({
        width: 640,
    	height: 480,
    	modal: true,
        autoOpen: false,
        buttons: { "Save Note" : function() { refWall.saveNoteEdit(); $(this).dialog('close'); },
                   "Cancel"    : function() { refWall.cancelNoteEdit(); $(this).dialog('close'); }
                 },
        open:  function() { refWall.startNoteEdit() },
        close: function() { refWall.endNoteEdit() }
    });
}

StickyWall.prototype.startNoteEdit = 
function() {
    debugMessage('StickyWall->startNoteEdit: Starting Edit')
    if(this.currentNote) {
        $('#note-form-title').val(this.currentNote.title);
        $('#note-form-text').val(this.currentNote.text);
        $('#note-form-text').focus();
        debugMessage('start: current note is not null');
    }
}

StickyWall.prototype.endNoteEdit = 
function() {
    debugMessage('StickyWall->endNoteEdit: Ending Edit');
    $('.note-form-editbox').val('');
    if(this.currentNote) {
        this.drawNote(this.currentNote);
        this.setTopmostNote(this.currentNote);
    }
    this.currentNote = null;
}

StickyWall.prototype.saveNoteEdit =
function() {
    debugMessage('StickyWall->saveNoteEdit: Saving Note')
    if(this.currentNote) {
        this.currentNote.title = $('#note-form-title').val()
        this.currentNote.text = $('#note-form-text').val();
        var noteIndex = this.getNoteIndex(this.currentNote.id);
        if(noteIndex < 0) {
            debugMessage('StickyWall->saveNoteEdit: Found note '+this.currentNote.id+', adding');
            this.addNote(this.currentNote);
            this.setTopmostNote(this.currentNote);
        }
        this.saveNotesToStorage();
    }
}

StickyWall.prototype.cancelNoteEdit =
function() {
    debugMessage('StickyWall->cancelNoteEdit: Cancelling')
    if(this.currentNote) {
        var noteIndex = this.getNoteIndex(this.currentNote.id);
        if(noteIndex < 0) {
            debugMessage('StickyWall->cancelNoteEdit: Found note '+this.currentNote.id+', erasing');
            this.eraseNote(this.currentNote);
            this.currentNote = null;
        }
    }
}

StickyWall.prototype.createNewNote =
function(foreColor,backColor) {
    var noteId = 'note'+generateGuid()
    this.currentNote = new StickyNote(noteId);
    this.currentNote.foreColor = foreColor;
    this.currentNote.backColor = backColor;
    
    var noteTime = new Date();
    this.currentNote.title = 
            noteTime.getFullYear()+'-'
            +(noteTime.getMonth() < 10 ? '0':'') + noteTime.getMonth()+'-'
            +(noteTime.getDate() < 10 ? '0':'')  + noteTime.getDate()+' '
            +(noteTime.getHours() < 10 ? '0':'') + noteTime.getHours()+':'
            +(noteTime.getMinutes() < 10 ? '0':'') + noteTime.getMinutes();

    if(this.noteForm) {
        this.noteForm.dialog('open');
    }
}

StickyWall.prototype.getNoteIndex = 
function(noteId) {
    debugMessage('StickyWall->getNoteIndex: Looking for note ('+noteId+')');
    for (var i=0; i < this.notes.length; i++) {
        if (this.notes[i].id == noteId) {
            debugMessage('StickyWall->getNoteIndex: Note found')
            return i;
        }
    }
    debugMessage('StickyWall->getNoteIndex: Note NOT found')
    return -1;
}

StickyWall.prototype.addNote = 
function(note) {
    this.notes.push(note);
    this.saveNotesToStorage();
    this.drawNote(note);
}

StickyWall.prototype.removeNote = 
function(noteId) {
    var ix = this.getNoteIndex(noteId);
    if(ix >= 0) {
        this.eraseNote(this.notes[ix]);
        this.notes.remove(ix);
        this.saveNotesToStorage();
    }
}

StickyWall.prototype.setTopmostNote = 
function(note) {
    debugMessage('StickyWall->setTopmostNote: Setting Top Most ('+note.id+')');
    var max_z = 0, min_z = 0;
    var select_z = function(index,value) { 
        var elem = $(this);
        var z = parseInt(elem.css('z-index') || 0);
        if (index == 0 || z > max_z) { max_z = z; }
        if (index == 0 || z < min_z) { min_z = z; }
    }
    var update_z = function(index,value) {
        var elem = $(this);
        var z = parseInt(elem.css('z-index') || 0);
        elem.css('z-index',(z - min_z));
    }
    $(".sticky-note").each(select_z)
    $(".sticky-note").each(update_z)

    var elem = $(".sticky-note#"+note.id);
    elem.css('z-index',(max_z-min_z+1))
}

StickyWall.prototype.drawNote = 
function(note) {
    debugMessage('StickyWall->drawNote: Drawing note ('+note.id+')');
    this.eraseNote(note);
    var noteTitleHtml = '<div class="sticky-note-title">'+htmlEncode(note.title)+'</div>';
    var noteBodyHtml = '<div class="sticky-note-body">'+noteTitleHtml+htmlEncode(note.text).replace(/\n/g,"<br>")+'</div>';
    var noteHtml = '<div class="sticky-note" id="'+note.id+'">'+noteBodyHtml+'</div>';
    $(".sticky-wall").append(noteHtml);

    var refWall = this;

    noteElem = $(".sticky-note#"+note.id)
    if(noteElem) {
        noteElem.draggable({
            start: function() { refWall.onNoteDragStart(note); },
            stop: function() { 
                var posTop = $(this).css('top'); 
                var posLeft = $(this).css('left'); 
                refWall.onNoteDragStop(note,posTop,posLeft);
            }
        });

        noteElem.css('color',note.foreColor);
        noteElem.css('background-color',note.backColor);
        noteElem.css('top',note.positionTop);
        noteElem.css('left',note.positionLeft);
        noteElem.bind('click', function() { refWall.onNoteClick(note) });
        noteElem.bind('dblclick', function() { refWall.onNoteDoubleClick(note) });

        var noteRot = 'rotate('+note.rotation+'deg)';
        var bodyRot = 'rotate('+(note.rotation*-1)+'deg)';
        var cssNote = {"-ms-transform":noteRot,"-moz-transform":noteRot,
                       "-webkit-transform":noteRot,"transform":noteRot}
        var cssBody = {"-ms-transform":bodyRot,"-moz-transform":bodyRot,
                       "-webkit-transform":bodyRot,"transform":bodyRot}
        $(".sticky-note#"+note.id).css(cssNote)
        $(".sticky-note#"+note.id+" .sticky-note-body").css(cssBody)
    } 
}

StickyWall.prototype.eraseNote = 
function(note) {
    debugMessage('StickyWall->eraseNote: Erasing note ('+note.id+')');
    $(".sticky-note#"+note.id).remove();
}

StickyWall.prototype.drawAllNotes = 
function() {
    for(var i=0;i < notes.length; i++) {
        this.drawNote(notes[i]);
    }
}

StickyWall.prototype.loadNotesFromStorage = 
function() {
    debugMessage("StickyWall->saveNoteToStorage: Loading Notes");
    if(localStorage) {
        var storedNotes = localStorage.getItem(this.storageKey);
        if(storedNotes) {
            debugMessage(storedNotes);
            var notesArray = $.evalJSON(storedNotes);
            for(var noteIndex = 0;noteIndex < notesArray.length; noteIndex++) {
                this.notes.push(notesArray[noteIndex]);
                this.drawNote(notesArray[noteIndex]);
            }
        }
    }
}

StickyWall.prototype.saveNotesToStorage = 
function() {
    debugMessage("StickyWall->saveNotesToStorage: Saving Notes");
    if(localStorage) {
        var storedNotes = $.toJSON(this.notes);
        localStorage.setItem(this.storageKey, storedNotes);
        debugMessage('Saved: '+storedNotes);
    }
}

StickyWall.prototype.onNoteDragStart = 
function(note) {
    debugMessage('StickyWall->onNoteDragStart: Starting Drag note ('+note.id+')');
    this.setTopmostNote(note);
}

StickyWall.prototype.onNoteDragStop = 
function(note,newTop,newLeft) {
    debugMessage('StickyWall->onNoteDragEnd: Ending Drag note ('+note.id+')');
    note.positionTop = newTop;
    note.positionLeft = newLeft;
    this.saveNotesToStorage();
    this.setTopmostNote(note);
}

StickyWall.prototype.onNoteClick = 
function(note) {
    this.setTopmostNote(note);
}

StickyWall.prototype.onNoteDoubleClick = 
function(note) {
    this.currentNote = note;

    if(this.noteForm) {
        this.noteForm.dialog('open');
    }
}

function StickyNote(noteId,noteValues) {
    var randomTop = Math.floor(Math.random()*501) + 40;
    var randomLeft = Math.floor(Math.random()*501) + 40;
    var randomRot = Math.floor(Math.random()*6)-3;
    var currentDate = new Date();

    var noteDefaults = {
        title: "New Note",
        text: "",
        foreColor: "000000",
        backColor: "FFFF00",
        positionTop: randomTop,
        positionLeft: randomLeft,
        rotation: randomRot,
        created: currentDate,
        updated: currentDate
    };
    $.extend(this,noteDefaults)
    $.extend(this,noteValues || {});
    this.id = noteId;
}

$(function() {
    $('p').bind('click', function() {
        var h = $(this).html()
        $(this).html(h + '<br>' + 'foo');
    });
});

var wall = null;

$(document).ready(function() { 
    wall = new StickyWall(); 
})


