export class Position {
  character: number
  line: number
  constructor(line: number, character: number) {
    this.line = line
    this.character = character
  }
  compareTo(other: Position) {
    const l = this.line - other.line
    if (l !== 0) {
      return Math.sign(l)
    } else {
      const c = this.character - other.character
      return Math.sign(c)
    }
  }
  isAfter(other: Position) { return this.compareTo(other) > 0 }
  isAfterOrEqual(other: Position) { return this.compareTo(other) >= 0 }
  isBefore(other: Position) { return this.compareTo(other) < 0 }
  isBeforeOrEqual(other: Position) { return this.compareTo(other) <= 0 }
  isEqual(other: Position) { return this.compareTo(other) === 0 }
  translate(lineDelta?: number, characterDelta?: number) {
    return new Position(this.line + (lineDelta || 0), this.character + (characterDelta || 0))
  }
  with(line?: number | { line?: number, character?: number }, character?: number) {
    if (typeof line === 'number') {
      return new Position(line || this.line, character || this.character)
    } else if (typeof line === 'object' && character === undefined) {
      return new Position(line.line || this.line, line.character || this.character)
    }
  }
}

export class Range {
  start: Position
  end: Position
  isEmpty: boolean
  isSingleLine: boolean
  constructor(start: Position, end: Position)
  constructor(startLine: number, startCharacter: number, endLine: number, endCharacter: number)

  constructor(s: Position | number, e: Position | number, endLine?: number, endCharacter?: number) {
    let p1: Position, p2: Position
    if (typeof s === 'number' && typeof e === 'number' && endLine !== undefined && endCharacter !== undefined) {
      p1 = new Position(s, e)
      p2 = new Position(endLine, endCharacter)
    } else if (typeof s === 'object' && typeof e === 'object' && endLine === undefined && endCharacter === undefined) {
      p1 = s
      p2 = e
    } else {
      throw new Error('Invalid constructor used for Range')
    }
    const swap = p1.isAfter(p2)
    this.start = swap ? p2 : p1
    this.end = swap ? p1 : p2
    this.isSingleLine = p1.line === p2.line
    this.isEmpty = p1.isEqual(p2)
  }

  contains(positionOrRange: Range | Position) {
    let pos: Position[] = []
    if (positionOrRange instanceof Range) {
      pos = [positionOrRange.start, positionOrRange.end]
    } else {
      pos = [positionOrRange]
    }
    return pos.every(p => p.isAfterOrEqual(this.start) && p.isBeforeOrEqual(this.end))
  }

  intersection(range: Range) {
    if (range.contains(this.start) || range.contains(this.end) || this.contains(range.start) || this.contains(range.end)) {
      const s = this.start.isAfter(range.start) ? this.start : range.start
      const e = this.end.isBefore(range.end) ? this.end : range.end
      return new Range(s, e)
    } else {
      return undefined
    }
  }

  isEqual(other: Range) {
    return this.start.isEqual(other.start) && this.end.isEqual(other.end)
  }

  union(other: Range) {
    const s = this.start.isBefore(other.start) ? this.start : other.start
    const e = this.end.isAfter(other.end) ? this.end : other.end
    return new Range(s, e)
  }

  with(start?: Position, end?: Position) {
    return new Range(start || this.start, end || this.end)
  }
}

export class Uri {
  authority: string
  fragment: string
  fsPath: string
  path: string
  query: string
  scheme: string

  static file(path: string) {
    return new Uri('file', '', path, '', '')
  }
  static from(components: { authority: string, fragment: string, path: string, query: string, scheme: string }) {
    return new Uri(components.scheme, components.authority, components.path, components.query, components.fragment)
  }
  static joinPath(base: Uri, ...pathSegments: string[]) {
    // dummy implementation for now
    return new Uri(base.scheme, base.authority, base.path + pathSegments.join('/'), base.query, base.fragment)
  }
  static parse(value: string, strict?: boolean) {
    // We assume strict to always be `true`
    const m = value.match(/([a-z]+):\/\/([^/?#]*)([^?#]*)(?:\?([^#]+))?(?:#(.+))?/)
    if (m) {
      return new Uri(m[1], m[2], m[3] || '/', m[4], m[5])
    } else {
      throw new Error(`Unable to parse Uri from string ${value}`)
    }
  }
  constructor(scheme: string, authority: string, path: string, query: string, fragment: string) {
    this.scheme = scheme
    this.authority = authority
    this.path = path
    this.query = query
    this.fragment = fragment
    this.fsPath = path // We don't do conversions of Windows paths like VSCode does
  }
  toJSON() {
    return {
      authority: this.authority,
      fragment: this.fragment,
      fsPath: this.fsPath,
      path: this.path,
      query: this.query,
      scheme: this.scheme,
    }
  }
  toString(skipEncoding?: boolean) {
    let s = `${this.scheme}://${this.authority}${this.path}`
    if (this.query?.length) {
      s += '?' + this.query 
    }
    if (this.fragment?.length) {
      s += '#' + this.fragment 
    }
    return s
  }
  with(change: { authority?: string, fragment?: string, path?: string, query?: string, scheme?: string }) {
    return new Uri(
      change.scheme || this.scheme,
      change.authority || this.authority,
      change.path || this.path,
      change.query || this.query,
      change.fragment || this.fragment,
    )
  }
}