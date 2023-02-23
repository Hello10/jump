import RouterHistory from './RouterHistory'

describe('RouterHistory', ()=> {
  let history
  beforeEach(()=> {
    global.window = {
      history: {
        pushState: jest.fn(),
        replaceState: jest.fn(),
        go: jest.fn()
      }
    }
    history = new RouterHistory({ web: true })
  })

  it('should push', ()=> {
    history.push('/foo')
    expect(history.current.url).toEqual('/foo')
    expect(history.length).toEqual(1)
    expect(global.window.history.pushState)
      .toHaveBeenCalledWith({url: '/foo'}, '', '/foo')
  })

  it('should replace', ()=> {
    history.push('/foo')
    history.replace('/bar')
    expect(history.current.url).toEqual('/bar')
    expect(history.length).toEqual(1)
    expect(global.window.history.replaceState)
      .toHaveBeenCalledWith({url: '/bar'}, '', '/bar')
  })

  it('should go back', ()=> {
    history.push('/foo')
    history.push('/bar')
    history.back()

    expect(history.current.url).toEqual('/foo')
    expect(history.length).toEqual(2)
    expect(global.window.history.go).toHaveBeenCalledWith(-1)

    history.go(-10)
    expect(history.current.url).toEqual('/foo')
  })

  it('should go forward', ()=> {
    history.push('/foo')
    history.push('/bar')
    history.back()
    history.forward()

    expect(history.current.url).toEqual('/bar')
    expect(history.length).toEqual(2)
    expect(global.window.history.go).toHaveBeenCalledWith(1)

    history.go(100)
    expect(history.current.url).toEqual('/bar')
  })
})