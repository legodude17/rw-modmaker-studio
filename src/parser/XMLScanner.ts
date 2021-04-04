/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export interface Scanner {
  scan(): TokenType;
  getTokenType(): TokenType;
  getTokenOffset(): number;
  getTokenLength(): number;
  getTokenEnd(): number;
  getTokenText(): string;
  getTokenError(): string | undefined;
  getScannerState(): ScannerState;
}

export enum TokenType {
  StartCommentTag, // 0
  Comment, // 1
  EndCommentTag, // 2
  StartTagOpen, // 3
  StartTagClose, // 4
  StartTagSelfClose, // 5
  StartTag, // 6
  EndTagOpen, // 7
  EndTagClose, // 8
  EndTag, // 9
  DelimiterAssign, // 10
  AttributeName, // 11
  AttributeValue, // 12
  StartXMLDeclarationTag, // 13
  XMLDeclaration, // 14
  EndXMLDeclarationTag, // 15
  Content, // 16
  Whitespace, // 17
  Unknown, // 18
  Script, // 19
  Styles, // 20
  EOS, // 21
}

export enum ScannerState {
  WithinContent,
  AfterOpeningStartTag,
  AfterOpeningEndTag,
  WithinXMLDeclaration,
  WithinTag,
  WithinEndTag,
  WithinComment,
  WithinScriptContent,
  WithinStyleContent,
  AfterAttributeName,
  BeforeAttributeValue,
}

export class MultiLineStream {
  private source: string;

  private len: number;

  private position: number;

  constructor(source: string, position: number) {
    this.source = source;
    this.len = source.length;
    this.position = position;
  }

  public eos(): boolean {
    return this.len <= this.position;
  }

  public getSource(): string {
    return this.source;
  }

  public pos(): number {
    return this.position;
  }

  public goBackTo(pos: number): void {
    this.position = pos;
  }

  public goBack(n: number): void {
    this.position -= n;
  }

  public advance(n: number): void {
    this.position += n;
  }

  public goToEnd(): void {
    this.position = this.source.length;
  }

  public nextChar(): number {
    return this.source.charCodeAt(this.position++) || 0;
  }

  public peekChar(n = 0): number {
    return this.source.charCodeAt(this.position + n) || 0;
  }

  public advanceIfChar(ch: number): boolean {
    if (ch === this.source.charCodeAt(this.position)) {
      this.position++;
      return true;
    }
    return false;
  }

  public advanceIfChars(ch: number[]): boolean {
    let i: number;
    if (this.position + ch.length > this.source.length) {
      return false;
    }
    for (i = 0; i < ch.length; i++) {
      if (this.source.charCodeAt(this.position + i) !== ch[i]) {
        return false;
      }
    }
    this.advance(i);
    return true;
  }

  public advanceIfRegExp(regex: RegExp): string {
    const str = this.source.substr(this.position);
    const match = str.match(regex);
    if (match) {
      this.position = this.position + match.index! + match[0].length;
      return match[0];
    }
    return '';
  }

  public advanceUntilRegExp(regex: RegExp): string {
    const str = this.source.substr(this.position);
    const match = str.match(regex);
    if (match) {
      this.position += match.index!;
      return match[0];
    }
    this.goToEnd();

    return '';
  }

  public advanceUntilChar(ch: number): boolean {
    while (this.position < this.source.length) {
      if (this.source.charCodeAt(this.position) === ch) {
        return true;
      }
      this.advance(1);
    }
    return false;
  }

  public advanceUntilChars(ch: number[]): boolean {
    while (this.position + ch.length <= this.source.length) {
      let i = 0;
      for (
        ;
        i < ch.length && this.source.charCodeAt(this.position + i) === ch[i];
        i++
      ) {}
      if (i === ch.length) {
        return true;
      }
      this.advance(1);
    }
    this.goToEnd();
    return false;
  }

  public skipWhitespace(): boolean {
    const n = this.advanceWhileChar((ch) => {
      return (
        ch === _WSP || ch === _TAB || ch === _NWL || ch === _LFD || ch === _CAR
      );
    });
    return n > 0;
  }

  public advanceWhileChar(condition: (ch: number) => boolean): number {
    const posNow = this.position;
    while (
      this.position < this.len &&
      condition(this.source.charCodeAt(this.position))
    ) {
      this.position++;
    }
    return this.position - posNow;
  }
}
const _BNG = '!'.charCodeAt(0);
const _MIN = '-'.charCodeAt(0);
const _LAN = '<'.charCodeAt(0);
const _RAN = '>'.charCodeAt(0);
const _FSL = '/'.charCodeAt(0);
const _QUE = '?'.charCodeAt(0);
const _EQS = '='.charCodeAt(0);
const _DQO = '"'.charCodeAt(0);
const _SQO = "'".charCodeAt(0);
const _NWL = '\n'.charCodeAt(0);
const _CAR = '\r'.charCodeAt(0);
const _LFD = '\f'.charCodeAt(0);
const _WSP = ' '.charCodeAt(0);
const _TAB = '\t'.charCodeAt(0);

const htmlScriptContents: { [key: string]: boolean } = {
  'text/x-handlebars-template': true,
};

export function createScanner(
  input: string,
  initialOffset = 0,
  initialState: ScannerState = ScannerState.WithinContent,
  emitPseudoCloseTags = false
): Scanner {
  const stream = new MultiLineStream(input, initialOffset);
  let state = initialState;
  let tokenOffset = 0;
  let tokenType: TokenType = TokenType.Unknown;
  let tokenError: string | undefined;

  let hasSpaceAfterTag: boolean;
  let lastTag: string;
  let lastAttributeName: string | undefined;
  let lastTypeValue: string | undefined;

  function nextElementName(): string {
    return stream.advanceIfRegExp(/^[_:\w][_:\w-.\d]*/).toLowerCase();
  }

  function nextAttributeName(): string {
    return stream
      .advanceIfRegExp(/^[^\s"'></=\x00-\x0F\x7F\x80-\x9F]*/)
      .toLowerCase();
  }

  function finishToken(
    offset: number,
    type: TokenType,
    errorMessage?: string
  ): TokenType {
    tokenType = type;
    tokenOffset = offset;
    tokenError = errorMessage;
    return type;
  }

  function scan(): TokenType {
    const offset = stream.pos();
    const oldState = state;
    const token = internalScan();
    if (
      token !== TokenType.EOS &&
      offset === stream.pos() &&
      !(
        emitPseudoCloseTags &&
        (token === TokenType.StartTagClose || token === TokenType.EndTagClose)
      )
    ) {
      console.log(
        `Scanner.scan has not advanced at offset ${offset}, state before: ${oldState} after: ${state}`
      );
      stream.advance(1);
      return finishToken(offset, TokenType.Unknown);
    }
    return token;
  }

  function internalScan(): TokenType {
    const offset = stream.pos();
    if (stream.eos()) {
      return finishToken(offset, TokenType.EOS);
    }
    let errorMessage;

    switch (state) {
      case ScannerState.WithinComment:
        if (stream.advanceIfChars([_MIN, _MIN, _RAN])) {
          // -->
          state = ScannerState.WithinContent;
          return finishToken(offset, TokenType.EndCommentTag);
        }
        stream.advanceUntilChars([_MIN, _MIN, _RAN]); // -->
        return finishToken(offset, TokenType.Comment);
      case ScannerState.WithinXMLDeclaration:
        if (stream.advanceIfChar(_RAN)) {
          // >
          state = ScannerState.WithinContent;
          return finishToken(offset, TokenType.EndXMLDeclarationTag);
        }
        stream.advanceUntilChar(_RAN); // >
        return finishToken(offset, TokenType.XMLDeclaration);
      case ScannerState.WithinContent:
        if (stream.advanceIfChar(_LAN)) {
          // <
          if (!stream.eos() && stream.peekChar() === _BNG) {
            // !
            if (stream.advanceIfChars([_BNG, _MIN, _MIN])) {
              // <!--
              state = ScannerState.WithinComment;
              return finishToken(offset, TokenType.StartCommentTag);
            }
          }
          if (stream.advanceIfChar(_FSL)) {
            // /
            state = ScannerState.AfterOpeningEndTag;
            return finishToken(offset, TokenType.EndTagOpen);
          }
          if (stream.advanceIfChar(_QUE)) {
            // <xml
            state = ScannerState.WithinXMLDeclaration;
            return finishToken(offset, TokenType.StartXMLDeclarationTag);
          }
          state = ScannerState.AfterOpeningStartTag;
          return finishToken(offset, TokenType.StartTagOpen);
        }
        stream.advanceUntilChar(_LAN);
        return finishToken(offset, TokenType.Content);
      case ScannerState.AfterOpeningEndTag: {
        const tagName = nextElementName();
        if (tagName.length > 0) {
          state = ScannerState.WithinEndTag;
          return finishToken(offset, TokenType.EndTag);
        }
        if (stream.skipWhitespace()) {
          // white space is not valid here
          return finishToken(
            offset,
            TokenType.Whitespace,
            'Tag name must directly follow the open bracket.'
          );
        }
        state = ScannerState.WithinEndTag;
        stream.advanceUntilChar(_RAN);
        if (offset < stream.pos()) {
          return finishToken(
            offset,
            TokenType.Unknown,
            'End tag name expected.'
          );
        }
        return internalScan();
      }
      case ScannerState.WithinEndTag:
        if (stream.skipWhitespace()) {
          // white space is valid here
          return finishToken(offset, TokenType.Whitespace);
        }
        if (stream.advanceIfChar(_RAN)) {
          // >
          state = ScannerState.WithinContent;
          return finishToken(offset, TokenType.EndTagClose);
        }
        if (emitPseudoCloseTags && stream.peekChar() === _LAN) {
          // <
          state = ScannerState.WithinContent;
          return finishToken(
            offset,
            TokenType.EndTagClose,
            'Closing bracket missing.'
          );
        }
        errorMessage = 'Closing bracket expected.';
        break;
      case ScannerState.AfterOpeningStartTag:
        lastTag = nextElementName();
        lastTypeValue = void 0;
        lastAttributeName = void 0;
        if (lastTag.length > 0) {
          hasSpaceAfterTag = false;
          state = ScannerState.WithinTag;
          return finishToken(offset, TokenType.StartTag);
        }
        if (stream.skipWhitespace()) {
          // white space is not valid here
          return finishToken(
            offset,
            TokenType.Whitespace,
            'Tag name must directly follow the open bracket.'
          );
        }
        state = ScannerState.WithinTag;
        if (stream.advanceIfChars([_LAN, _FSL])) {
          // </
          state = ScannerState.AfterOpeningEndTag;
          return finishToken(offset, TokenType.EndTagOpen);
        }
        stream.advanceUntilChar(_RAN);
        if (offset < stream.pos()) {
          return finishToken(
            offset,
            TokenType.Unknown,
            'Start tag name expected.'
          );
        }
        return internalScan();
      case ScannerState.WithinTag:
        if (stream.skipWhitespace()) {
          hasSpaceAfterTag = true; // remember that we have seen a whitespace
          return finishToken(offset, TokenType.Whitespace);
        }
        if (hasSpaceAfterTag) {
          lastAttributeName = nextAttributeName();
          if (lastAttributeName.length > 0) {
            state = ScannerState.AfterAttributeName;
            hasSpaceAfterTag = false;
            return finishToken(offset, TokenType.AttributeName);
          }
        }
        if (stream.advanceIfChars([_FSL, _RAN])) {
          // />
          state = ScannerState.WithinContent;
          return finishToken(offset, TokenType.StartTagSelfClose);
        }
        if (stream.advanceIfChar(_RAN)) {
          // >
          /*
					if (lastTag === 'script') {
						if (lastTypeValue && htmlScriptContents[lastTypeValue]) {
							// stay in html
							state = ScannerState.WithinContent;
						} else {
							state = ScannerState.WithinScriptContent;
						}
					} else if (lastTag === 'style') {
						state = ScannerState.WithinStyleContent;
					} else {
						state = ScannerState.WithinContent;
					}
					*/
          state = ScannerState.WithinContent;
          return finishToken(offset, TokenType.StartTagClose);
        }
        if (emitPseudoCloseTags && stream.peekChar() === _LAN) {
          // <
          state = ScannerState.WithinContent;
          return finishToken(
            offset,
            TokenType.StartTagClose,
            'Closing bracket missing.'
          );
        }
        stream.advance(1);
        return finishToken(
          offset,
          TokenType.Unknown,
          'Unexpected character in tag.'
        );
      case ScannerState.AfterAttributeName:
        if (stream.skipWhitespace()) {
          hasSpaceAfterTag = true;
          return finishToken(offset, TokenType.Whitespace);
        }

        if (stream.advanceIfChar(_EQS)) {
          state = ScannerState.BeforeAttributeValue;
          return finishToken(offset, TokenType.DelimiterAssign);
        }
        state = ScannerState.WithinTag;
        return internalScan(); // no advance yet - jump to WithinTag
      case ScannerState.BeforeAttributeValue: {
        if (stream.skipWhitespace()) {
          return finishToken(offset, TokenType.Whitespace);
        }
        // in xml we don't have any attribute value that is not capsuled with "", or ''
        // let attributeValue = stream.advanceIfRegExp(/^[^\s"'`=<>]+/);
        // if (attributeValue.length > 0) {
        // if (stream.peekChar() === _RAN && stream.peekChar(-1) === _FSL) { // <foo bar=http://foo/>
        // stream.goBack(1);
        // attributeValue = attributeValue.substr(0, attributeValue.length - 1);
        // }
        // if (lastAttributeName === 'type') {
        // lastTypeValue = attributeValue;
        // }
        // state = ScannerState.WithinTag;
        // hasSpaceAfterTag = false;
        // return finishToken(offset, TokenType.AttributeValue);
        // }
        const ch = stream.peekChar();
        if (ch === _SQO || ch === _DQO) {
          stream.advance(1); // consume quote
          if (stream.advanceUntilChar(ch)) {
            stream.advance(1); // consume quote
          }
          // if (lastAttributeName === 'type') {
          // lastTypeValue = stream.getSource().substring(offset + 1, stream.pos() - 1);
          // }
          state = ScannerState.WithinTag;
          hasSpaceAfterTag = false;
          return finishToken(offset, TokenType.AttributeValue);
        }
        state = ScannerState.WithinTag;
        hasSpaceAfterTag = false;
        return internalScan(); // no advance yet - jump to WithinTag
      }
      case ScannerState.WithinScriptContent:
        // see http://stackoverflow.com/questions/14574471/how-do-browsers-parse-a-script-tag-exactly
        let sciptState = 1;
        while (!stream.eos()) {
          const match = stream.advanceIfRegExp(/<!--|-->|<\/?script\s*\/?>?/i);
          if (match.length === 0) {
            stream.goToEnd();
            return finishToken(offset, TokenType.Script);
          }
          if (match === '<!--') {
            if (sciptState === 1) {
              sciptState = 2;
            }
          } else if (match === '-->') {
            sciptState = 1;
          } else if (match[1] !== '/') {
            // <script
            if (sciptState === 2) {
              sciptState = 3;
            }
          } else {
            // </script
            if (sciptState === 3) {
              sciptState = 2;
            } else {
              stream.goBack(match.length); // to the beginning of the closing tag
              break;
            }
          }
        }
        state = ScannerState.WithinContent;
        if (offset < stream.pos()) {
          return finishToken(offset, TokenType.Script);
        }
        return internalScan(); // no advance yet - jump to content
      case ScannerState.WithinStyleContent:
        stream.advanceUntilRegExp(/<\/style/i);
        state = ScannerState.WithinContent;
        if (offset < stream.pos()) {
          return finishToken(offset, TokenType.Styles);
        }
        return internalScan(); // no advance yet - jump to content
      default:
        break;
    }

    stream.advance(1);
    state = ScannerState.WithinContent;
    return finishToken(offset, TokenType.Unknown, errorMessage);
  }
  return {
    scan,
    getTokenType: () => tokenType,
    getTokenOffset: () => tokenOffset,
    getTokenLength: () => stream.pos() - tokenOffset,
    getTokenEnd: () => stream.pos(),
    getTokenText: () => stream.getSource().substring(tokenOffset, stream.pos()),
    getScannerState: () => state,
    getTokenError: () => tokenError,
  };
}