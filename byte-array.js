function ByteArray(){
  this.bin = [];
}

ByteArray.prototype.getData = function(){
	return this.bin.map(function(a){
	  return String.fromCharCode(a);
	}).join('')
}
ByteArray.prototype.writeByte = function(val){
  this.bin.push(val >> 0 & 255);
}
ByteArray.prototype.writeUTFBytes = function(string){
  for(var l = string.length, i = 0; i < l; i++)
    this.writeByte(string.charCodeAt(i));
}
ByteArray.prototype.writeBytes = function(array, offset, length){
  for(var l = length || array.length, i = offset||0; i < l; i++)
    this.writeByte(array[i]);
}
