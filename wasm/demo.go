//go:build js && wasm

package main

import (
	"fmt"
	"unsafe"
)

// A tiny bump allocator for demo purposes. Not production ready.
var heap = make([]byte, 16*1024)
var head uint32 = 0

//export alloc
func alloc(size uint32) uint32 {
	if size == 0 {
		return 0
	}
	if head+size >= uint32(len(heap)) {
		head = 0
	}
	ptr := uint32(uintptr(unsafe.Pointer(&heap[head])))
	head += size
	return ptr
}

var lastLen uint32

//export result_len
func result_len() uint32 {
	return lastLen
}

//export greet
func greet(ptr uint32, length uint32) uint32 {
	name := readString(ptr, length)
	msg := fmt.Sprintf("Hello from Go/Wasm, %s!", name)
	return writeString(msg)
}

func readString(ptr uint32, length uint32) string {
	if ptr == 0 || length == 0 {
		return ""
	}
	data := unsafe.Slice((*byte)(unsafe.Pointer(uintptr(ptr))), length)
	return string(data)
}

func writeString(s string) uint32 {
	b := []byte(s)
	start := alloc(uint32(len(b)))
	if start == 0 {
		return 0
	}
	lastLen = uint32(len(b))
	buf := unsafe.Slice((*byte)(unsafe.Pointer(uintptr(start))), len(b))
	copy(buf, b)
	return start
}

func main() {}
