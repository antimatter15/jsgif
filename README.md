Pure JavaScript HTML5 <canvas> to (Animated) GIF Conversion
===========================================================

Based on [as3gif](http://code.google.com/p/as3gif/) Ported by [antimatter15](http://antimatter15.com)

This project is a port of the as3gif project which

> AS3GIF lets you play and encode animated GIF's with ActionScript 3

Since web pages can usually natively play GIFs fine, it's only a port of the GIFEncoder
portions of the library.









WebWorkers
============

The process isn't really the fastest thing ever, so you should
use WebWorkers for piecing together animations more than a few frames
long.


I haven't actually tried it yet, but here's some incomplete mock-JS which
should be able to do stuff once you add the boring stuff like serializing
and deserializing the content (actually, i have most of the serializing done
but you have to deserialize that and that's really the boring part).

    var frame_index,
        frame_length,
        height, 
        width,
        imageData; //get it from onmessage
        
    var encoder = new GIFEncoder(); //create a new GIFEncoder for every new job
    if(frame_index == 0){
      encoder.start();
    }else{
      encoder.setProperties(true, true); //started, firstFrame
    }
    encoder.setSize(height, width);
    encoder.addFrame(imageData, true);
    if(frame_length == frame_index){
      encoder.finish()
    }
    postMessage(frame_index + encoder.stream().getData()) //on the page, search for the GIF89a to see the frame_index


    var animation_parts = new Array(frame_length);
    //on the handler side:

    var worker = new WebWorker('blahblahblah.js');
    worker.onmessage = function(e){
      //handle stuff, like get the frame_index
      animation_parts[frame_index] = frame_data;
      //check when everything else is done and then do animation_parts.join('') and have fun
    }
    var imdata = context.getImageData(0,0,canvas.width,canvas.height)
    var len = canvas.width * canvas.height * 4;
    var imarray = [];
    for(var i = 0; i < len; i++){
      imarray.push(imdata[i]);
    }

    worker.postMessage(frame_index + ';' + frame_length + ';' + canvas.height + ';' + canvas.width + ';' + imarray.join(','))
