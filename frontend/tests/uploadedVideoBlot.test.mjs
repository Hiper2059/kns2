import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DIRECT_VIDEO_FORMAT,
  registerDirectVideoBlot
} from '../src/components/editor/directVideoBlot.js'

class FakeVideoNode {
  constructor() {
    this.attributes = new Map()
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value))
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null
  }
}

class FakeBlockEmbed {
  static create() {
    return new FakeVideoNode()
  }
}

const createFakeQuill = () => {
  let registeredBlot = null
  let registerCount = 0

  return {
    import(path) {
      assert.equal(path, 'blots/block/embed')
      return FakeBlockEmbed
    },
    register(blot) {
      registeredBlot = blot
      registerCount += 1
    },
    getRegisteredBlot: () => registeredBlot,
    getRegisterCount: () => registerCount
  }
}

test('đăng ký video trực tiếp đúng một lần cho mỗi Quill instance', () => {
  const quill = createFakeQuill()

  registerDirectVideoBlot(quill)
  registerDirectVideoBlot(quill)

  assert.equal(quill.getRegisterCount(), 1)
  assert.equal(quill.getRegisteredBlot().blotName, DIRECT_VIDEO_FORMAT)
  assert.equal(quill.getRegisteredBlot().tagName, 'video')
})

test('giữ nguyên URL MOV và các thuộc tính cần thiết khi lưu video', () => {
  const quill = createFakeQuill()
  registerDirectVideoBlot(quill)
  const DirectVideoBlot = quill.getRegisteredBlot()
  const movUrl = 'https://res.cloudinary.com/demo/video/upload/bai-giang.mov'

  const node = DirectVideoBlot.create(movUrl)

  assert.equal(node.getAttribute('src'), movUrl)
  assert.equal(node.getAttribute('controls'), '')
  assert.equal(node.getAttribute('preload'), 'metadata')
  assert.equal(node.getAttribute('playsinline'), '')
  assert.equal(DirectVideoBlot.value(node), movUrl)
})
