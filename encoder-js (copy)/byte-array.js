//------------------------------------------------------------------------------
// http://si-robertson.com/javascript-bytearray
//------------------------------------------------------------------------------

ByteArray = function() {
	if( ByteArray.CHR == null ) {
		ByteArray.CHR = [];
		ByteArray.ORD = [];
		var i = 0;
		var n = 256;
		var c;
		while( i < n ) {
			c = String.fromCharCode( i );
			ByteArray.CHR[ i ] = c;
			ByteArray.ORD[ c ] = i;
			i ++;
		}
	}
	this.bin = [];
	this.pos = 0;
}

ByteArray.CHR = null;
ByteArray.ORD = null;

ByteArray.prototype = {

	// allows the byte array to be cast to a binary string
	toString: function() {
		return this.getData();
	},

	// returns the byte array as a binary string
	getData: function() {
		var i = 0;
		var n = this.bin.length;
		var v = '';
		while( i < n ) {
			v += ByteArray.CHR[ this.bin[ i ++ ] ];
		}
		return v;
	},

	// populates the byte array with bytes from a binary string,
	// the position of the byte pointer is reset to 0
	setData: function( binstr ) {
		var i = this.bin.length = binstr.length;
		while( i -- ) {
			this.bin[ i ] = ByteArray.ORD[ binstr[ i ] ];
		}
		this.pos = 0;
	},

	// returns the position of the byte pointer
	getPosition: function() {
		return this.pos;
	},

	// sets the position of the byte pointer
	setPosition: function( v ) {
		var n = this.bin.length;
		this.pos = v < 0 ? 0 : v > n ? n : v;
	},

	// returns the length of the byte array
	getLength: function() {
		return this.len;
	},

	// writes an integer (8-bit) to the byte array
	writeByte: function( v ) {
		if( v < 0 ) {
			v = -( v ^ 0xFF ) - 1;
		}
		this.bin[ this.pos ++ ] = v >> 0 & 255;
	},

  //writes a UTF string
  writeUTFBytes: function(v){
    for(var l = v.length, i = 0; i < l; i++){
      this.writeByte(v.charCodeAt(i));
    }
  },

  //writes a string
  writeBytes: function(v){
    for(var l = v.length, i = 0; i < l; i++){
      this.writeByte(v.charCodeAt(i));
    }
  },


	// writes an integer (16-bit) to the byte array
	writeShort: function( v ) {
		if( v < 0 ) {
			v = -( v ^ 0xFFFF ) - 1;
		}
		this.bin[ this.pos ++ ] = v >> 8 & 255;
		this.bin[ this.pos ++ ] = v >> 0 & 255;
	},

	// writes an integer (32-bit) to the byte array
	writeInt: function( v ) {
		if( v < 0 ) {
			v = -( v ^ 0xFFFFFFFF ) - 1;
		}
		this.bin[ this.pos ++ ] = v >> 24 & 255;
		this.bin[ this.pos ++ ] = v >> 16 & 255;
		this.bin[ this.pos ++ ] = v >>  8 & 255;
		this.bin[ this.pos ++ ] = v >>  0 & 255;
	},

	// reads a signed integer (8-bit) from the byte array
	readByte: function() {
		var v = this.readUnsignedByte();
		if( v >> 7 ) {
			v = -( v ^ 0xFF ) - 1;
		}
		return v;
	},

	// reads an unsigned integer (8-bit) from the byte array
	readUnsignedByte: function() {
		return this.bin[ this.pos ++ ];
	},

	// reads an integer (16-bit) from the byte array
	readShort: function() {
		var v = this.readUnsignedShort();
		if( v >> 15 ) {
			v = -( v ^ 0xFFFF ) - 1;
		}
		return v;
	},

	// reads an unsigned integer (16-bit) from the byte array
	readUnsignedShort: function() {
		return this.bin[ this.pos ++ ] << 8 |
		       this.bin[ this.pos ++ ];
	},

	// reads an integer (32-bit) from the byte array
	readInt: function() {
		var v = this.readUnsignedInt();
		if( v >> 31 ) {
			v = -( v ^ 0xFFFFFFFF ) - 1;
		}
		return v;
	},

	// reads an unsigned integer (32-bit) from the byte array
	readUnsignedInt: function() {
		return this.bin[ this.pos ++ ] << 24 |
		       this.bin[ this.pos ++ ] << 16 |
		       this.bin[ this.pos ++ ] <<  8 |
		       this.bin[ this.pos ++ ];
	}

}
