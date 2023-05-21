/**
 * This class represents an array of bytes in a compact, memory-efficient format.
 * This was written to be used by GIFEncoder so it could encode larger GIF files than possible with a non-typed Array of number.
 * @author Josh Greig
 */
function DynamicByteArray() {
	this.arr = new Uint8Array(1000);// the initial capacity of 1000 will likely expand.
	this.len = 0;
}

DynamicByteArray.prototype.get = function(index) {
	return this.arr[index];
};

DynamicByteArray.prototype.getLength = function() {
	return this.len;
};

DynamicByteArray.prototype.toCompactUint8Array = function() {
	if (this.arr.length !== this.len) {
		const result = new Uint8Array(this.len);
		for (let i = 0; i < this.len; i++) {
			result[i] = this.arr[i];
		}
		this.arr = result;
	}
	return this.arr;
};

DynamicByteArray.prototype.writeByte = function(val) {
	if (this.len >= this.arr.length) {
		var newCapacity = this.arr.length * 2;
		// If the capacity is huge, the risk of running out of memory is higher
		// so we want to expand in 50% intervals instead of 100% intervals.
		if (newCapacity > 50000000) {
			newCapacity = this.arr.length * 1.5;
		}
		var newArr = new Uint8Array(newCapacity);
		for (let i = 0; i < this.arr.length; i++) {
			newArr[i] = this.arr[i];
		}
		this.arr = newArr;
	}
	this.arr[this.len++] = val;
};
