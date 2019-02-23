// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Grid, Row, Col, ButtonToolbar, Button, FormGroup, ControlLabel, FormControl, HelpBlock, Checkbox, ProgressBar } from 'react-bootstrap';
import { SketchPicker } from 'react-color';
import routes from '../constants/routes';
import styles from './Home.css';

const path = require('path');
const { ipcRenderer } = window.require("electron");
const fork = require('child_process').fork;
const signCommunicatorScript = (process.mainModule.filename.indexOf('app.asar') === -1) ?
    './app/processes/SignCommunicator.js' :
    path.join(process.resourcesPath, 'app.asar/app/processes/SignCommunicator.js');

type Props = {};

export default class Home extends Component<Props> {
  props: Props;

  // 3 input fields
  // RGB color picker
  // Send button
  // Clear Screen button
  // Undo button

  // it would be to center each line
  // a top line large font followed by two lines of small font

  // width X height
  // Screen - 192 X 40
  // Small Font - 5 X 8
  // Large Font - 10 X 16

  childProcess;

  constructor() {
    super();
    this.state = {
      debugText: '',
      numberOfMessages: 0,
      messageNumber: 0,
      largeFont: true,
      textRow1: '',
      textRow2: '',
      textRow3: '',
      textRow4: '',
      textColor: {
        r: 0,
        g: 220,
        b: 0,
        a: 1,
      },
      colorRed: true,
      colorGreen: true,
      colorBlue: true,
      brightnessMax: 230,
      brightnessMin: 50,
      sendingMessages: false,
      display: Array(40).fill('------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------'),
    }
    // const displayTemp = new Array(40)
    // for (let index = 0; index < displayTemp.length; index += 1) {
    //   // display[index] = new Array(192);
    //   displayTemp[index] = '------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------'
    // }
    // this.setState({ display: displayTemp })
  }

  sleep = (miliseconds) => {
    const currentTime = new Date().getTime();

    while (currentTime + miliseconds >= new Date().getTime()) {}
  }

  // Networking
  putHTML = (_messages, debug) => {
    const http = new XMLHttpRequest();
    const url = 'http://192.168.4.100';
    let messages = _messages;

    // Checking if messages is an array
    if (!Array.isArray(messages)) {
      // Converting to an array if not
      messages = [messages];
    }

    messages.forEach(message => {
      const params = `<sign>{${message}}<endsign>`;
      console.log('debug', params)
      http.open('POST', url, true);

      // Send the proper header information along with the request
      http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

      let isHTMLFail = true;

      // POST callback
      http.onreadystatechange = () => {
        // alert(http.responseText);
        if (http.readyState === 4 && http.status === 200) {
          // document.getElementById("debug").innerHTM += http.responseText;
          isHTMLFail = false;
        }
      }

      if (!debug) {
        http.send(params);
      }

      this.sleep(2000);

      return isHTMLFail;
    });
  }

  sendMessages = (messages) => {
    console.log(); //
    return new Promise((resolve) => { // may not need a Promise here
      console.log('sendMessages start');

      this.setState({ numberOfMessages: messages.length });

      this.setState({ sendingMessages: true });
      let cmd = 'putHTML';
      let signCommunicatorChild = fork(signCommunicatorScript, [], {
        // detached: false,
        silent: true,
        execArgv:["--prof"]
      })
      ipcRenderer.send('pid-message-add', signCommunicatorChild.pid); // sending back pid for management of forked processes
      signCommunicatorChild.send({
        command: cmd,
        messages,
      })

      // Returns
      signCommunicatorChild.on('message', (message) => {
        console.log('sendMessages - message');
        if (message.status === 'done') {
          // Removing all of the listeners, so we don't have a bunch of duplicate listeners
          this.setState({ sendingMessages: false });
          ipcRenderer.send('pid-message-remove', signCommunicatorChild.pid); // sending back pid for management of forked processes
          console.log('sendMessages - done');
          signCommunicatorChild.kill();
          resolve(message);
        } else if (message.status === 'processing') {
          console.log('sendMessages - processing');
          this.setState({ messageNumber: message.commandNumber });
          this.setState({ debugText: `${this.state.messageNumber}/${this.state.numberOfMessages} : ${message.commandMessage}` })
        }
      })

      signCommunicatorChild.stdout.on('data', (data) => {
        console.log(`stdio: ${data}`);
      })
      signCommunicatorChild.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      })
    })
  }

  // ------------------------------------------------------------------------
  // Cursor
  setCursor = () => {
    const xcursor = document.getElementById("xcursor").value;
    const ycursor = document.getElementById("ycursor").value;
    const params = `"cursor":[${xcursor}, ${ycursor}]`;
    this.putHTML(params);
  }

  cursorSlider = () => {
    const pixelloc = document.getElementById("cursorsliderOutId").value;
    const params = `"moveCursor":${pixelloc}`;
    this.putHTML(params);
  }

  cursorToRight = () => {
    const params = '"command":"moveCursorRight"';
    const tmp = parseInt(document.getElementById("xcursor").value, 10);
    document.getElementById("xcursor").value = tmp + 1; 
    this.putHTML(params);
  }

  cursorToLeft = () => {
    const params = '"command":"moveCursorLeft"';
    document.getElementById("xcursor").value = parseInt(document.getElementById("xcursor").value, 10) - 1; 
    this.putHTML(params);
  }

  cursorToDown = () => {
    const params = '"command":"moveCursorDown"';
    this.putHTML(params);
  }

  sendText = () => {
    // updateColor();
    const row1text = document.getElementById("row1").value;
    // let row2text = document.getElementById("row2").value;
    const wid1 = document.getElementById("width1").value;
    // let wid2 = document.getElementById("width2").value;

    let fontsize = 1;
    if (document.getElementById("fontsize").checked) fontsize = 2;

    // let params = '"text1":"' + row1text + '","text2":"' + row2text + '","width1":' + wid1 + ',"width2":' + wid2;
    const params = `"text":"${row1text}","width":${wid1},"fontsize":${fontsize}`;
    this.putHTML(params);
    // updateColor();
  }

  undo = () => {
    document.getElementById("Red1").value = 0;
    document.getElementById("Green1").value = 0;
    document.getElementById("Blue1").value = 0;
    document.getElementById("red1OutId").value = 0;
    document.getElementById("green1OutId").value = 0;
    document.getElementById("blue1OutId").value = 0;
    const params = '"color":[0,0,0]';
    this.putHTML(params);
  }

  updateColorTwoRows = () => {
    this.updateColor(1);
    this.updateColor(2);
  }

  sendPixel = () => {
    const params = document.getElementById("pixeltext").value;
    const jsonpix = JSON.parse(params);
    for (let nn = 0; nn < jsonpix.pix.length / 2; nn += 1) {
      const newparam = `"pix":[${jsonpix.pix[nn * 2]}, ${jsonpix.pix[nn * 2 + 1]}]`;
      this.putHTML(newparam);

      const ms = new Date().getTime();
      console.log(nn);
      while (new Date().getTime() < (ms + 1000)) {
        // waiting
      }
    }

    // PutHTML(params.replace(/\s/g,''));
  }

  updateMaxBrightness = () => {
    const brigh = document.getElementById("BrightnessId").value;
    const params = `"maxBright": ${brigh}`;
    this.putHTML(params);
  }

  updateMinBrightness = () => {
    const brigh = document.getElementById("minBrightnessId").value;
    const params = `"minBright": ${brigh}`;
    this.putHTML(params);
  }

  updateRow1Text = (event) => {
    this.setState({textRow1: event.target.value})
  }

  updateRow2Text = (event) => {
    this.setState({textRow2: event.target.value})
  }

  updateRow3Text = (event) => {
    this.setState({textRow3: event.target.value});
  }

  updateRow4Text = (event) => {
    this.setState({textRow4: event.target.value});
  }

  updateMaxBrightness = (event) => {
    this.setState({brightnessMax: event.target.value});
  }

  updateMinBrightness = (event) => {
    this.setState({brightnessMin: event.target.value});
  }

  getValidationStateRow1 = () => {
    const { largeFont, textRow1 } = this.state;
    if (textRow1.length > 16 && largeFont) return 'error';
    if (textRow1.length > 32 && !largeFont) return 'error';
    return null;
  }

  getValidationStateRow2 = () => {
    const { largeFont, textRow2 } = this.state;
    if (textRow2.length > 16 && largeFont) return 'error';
    if (textRow2.length > 32 && !largeFont) return 'error';
    return null;
  }

  getValidationStateRow3= () => {
    const { largeFont, textRow3 } = this.state;
    if (textRow3.length > 16 && largeFont) return 'error';
    if (textRow3.length > 32 && !largeFont) return 'error';
    return null;
  }

  getValidationStateRow4 = () => {
    const { largeFont, textRow4 } = this.state;
    if (textRow4.length > 16 && largeFont) return 'error';
    if (textRow4.length > 32 && !largeFont) return 'error';
    return null;
  }

  getValidationStateMaxBrightness = () => {
    const { brightnessMax } = this.state;
    if (brightnessMax > 255) return 'error';
    if (brightnessMax < 100) return 'error';
    return null;
  }

  getValidationStateMinBrightness = () => {
    const { brightnessMin } = this.state;
    if (brightnessMin > 200) return 'error';
    if (brightnessMin < 10) return 'error';
    return null;
  }

  handleTextColorChange = (color) => {
    this.setState({ textColor: color.rgb });
  }

  handleFontChange = (event) => {
    this.setState({largeFont: event.target.checked})
  }

  handleColorRedChange = (event) => {
    this.setState({colorRed: event.target.checked})
  }

  handleColorGreenChange = (event) => {
    this.setState({colorGreen: event.target.checked})
  }

  handleColorBlueChange = (event) => {
    this.setState({colorBlue: event.target.checked})
  }

  clearScreen = () => {
    // Commands
    const messages = []
    messages.push('"command": "clearall"'); // Sending clear all
    this.sendMessages(messages);
  }
  
  sendBrightness = () => {
    const {
      brightnessMax,
      brightnessMin,
    } = this.state;
    
    // Commands
    const messages = []
    messages.push(`"maxBright": ${brightnessMax}`); // Sending Max Brightness
    messages.push(`"minBright": ${brightnessMin}`); // Sending Min Brightness
    this.sendMessages(messages);
  }

  sendText = () => {
    const {
      textRow1,
      textRow2,
      textRow3,
      textRow4,
      textColor,
      colorRed,
      colorGreen,
      colorBlue,
      largeFont,
      brightnessMax,
      brightnessMin,
    } = this.state;

    console.log('send text')
    console.log(textRow1)
    console.log(textRow2)
    console.log(textRow3)
    console.log(textRow4)

    // Commands
    const messages = []
    // messages.push('"command": "clearall"'); // Sending clear all
    // messages.push(`"maxBright": ${brightnessMax}`); // Sending Max Brightness
    // messages.push(`"minBright": ${brightnessMin}`); // Sending Min Brightness
    // messages.push(`"color": [${textColor.r}, ${textColor.g}, ${textColor.b}]`); // Sending color
    messages.push(`"color": [${colorRed ? 255 : 0}, ${colorGreen ? 255 : 0}, ${colorBlue ? 255 : 0}]`); // Sending color
    messages.push('"cursor": [0,1]'); // Moving the cursor to the row 1

    // Larger Font
    if (largeFont) {
      messages.push(`"width": "0", "fontsize": "2", "text": "${textRow1}"`); // Entering row 1
      messages.push('"cursor": [0, 24]'); // Moving the cursor to the row 2
      messages.push(`"width": "0", "fontsize": "2", "text": "${textRow2}"`); // Entering row 2
    } else {
      messages.push(`"width": "0", "fontsize": "1", "text": "${textRow1}"`); // Entering row 1
      messages.push('"cursor": [0, 10]'); // Moving the cursor to the row 2
      messages.push(`"width": "0", "fontsize": "1", "text": "${textRow2}"`); // Entering row 2
      messages.push('"cursor": [0, 20]'); // Moving the cursor to the row 3
      messages.push(`"width": "0", "fontsize": "1", "text": "${textRow3}"`); // Entering row 3
      messages.push('"cursor": [0, 30]'); // Moving the cursor to the row 4
      messages.push(`"width": "0", "fontsize": "1", "text": "${textRow4}"`); // Entering row 4
    }

    // debugger
    // console.log('messages: ', messages)
    // this.setState({debugText: messages})
    // this.putHTML(messages, false)
    this.sendMessages(messages);
  }

  // hex2bin = (hex) => {
  //   return (parseInt(hex, 16).toString(2))//.padStart(6, '0');
  // }

  hex2bin = (hex) =>
{
    var bytes = [], str;

    for(var i=0; i< hex.length-1; i+=2)
        bytes.push(parseInt(hex.substr(i, 2), 16));

    return String.fromCharCode.apply(String, bytes);    
}

  testing = () => {
    const {
      textRow1,
      display,
    } = this.state;
    console.log(textRow1)
    // Screen - 192 X 40
    let cursor = {
      x: 0,
      y: 0,
    }
    // const display = new Array(40)
    // for (let index = 0; index < display.length; index += 1) {
    //   // display[index] = new Array(192);
    //   display[index] = '------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------'
    // }
    console.log(display)
    // const text = textRow1;
    const MONOSPACED_FONT = {
      // space
      ' ': [
        '---',
        '---',
        '---',
        '---',
        '---',
        '---',
        '---',
        '---',
      ],
      // !
      '!': [
        '1-',
        '1-',
        '1-',
        '1-',
        '--',
        '--',
        '1-',
        '--',
      ],
      // "
      '"': [
        '1--1-',
        '1--1-',
        '1--1-',
        '-----',
        '-----',
        '-----',
        '-----',
        '-----',
      ],
      // #
      '#': [
        '-1--1--',
        '-1--1--',
        '111111-',
        '-1--1--',
        '-1--1--',
        '-------',
      ],
      // A
      A: [
        '--11---',
        '-1--1--',
        '1----1-',
        '111111-',
        '1----1-',
        '1----1-',
        '1----1-',
        '-------',
      ],
      // B
      B: [
        '11111--',
        '1----1-',
        '1----1-',
        '11111--',
        '1----1-',
        '1----1-',
        '11111--',
        '-------',
      ],
      // C
      C: [
        '-1111--',
        '1----1-',
        '1------',
        '1------',
        '1------',
        '1----1-',
        '-1111--',
        '-------',
      ],
      // D
      D: [
        '1111---',
        '1---1--',
        '1----1-',
        '1----1-',
        '1----1-',
        '1---1--',
        '1111---',
        '-------',
      ],
      // E
      E: [
        '111111-',
        '1------',
        '1------',
        '1111---',
        '1------',
        '1------',
        '111111-',
        '-------',
      ],
      // F
      F: [
        '111111-',
        '1------',
        '1------',
        '1111---',
        '1------',
        '1------',
        '1------',
        '-------',
      ],
      // G
      G: [
        '-1111--',
        '1----1-',
        '1------',
        '1--111-',
        '1----1-',
        '1----1-',
        '-1111--',
        '-------',
      ],
      // H
      H: [
        '1----1-',
        '1----1-',
        '1----1-',
        '111111-',
        '1----1-',
        '1----1-',
        '1----1-',
        '-------',
      ],
      // I
      I: [
        '111-',
        '-1--',
        '-1--',
        '-1--',
        '-1--',
        '-1--',
        '111-',
        '----',
      ],
      // J
      J: [
        '----1-',
        '----1-',
        '----1-',
        '----1-',
        '----1-',
        '1---1-',
        '-111--',
        '------',
      ],
      K: [
        '1----1-',
        '1---1--',
        '1--1---',
        '111----',
        '1--1---',
        '1---1--',
        '1----1-',
        '-------',
      ],
      L: [
        '1------',
        '1------',
        '1------',
        '1------',
        '1------',
        '1------',
        '111111-',
        '-------',
      ],
      M: [
        '1----1-',
        '11--11-',
        '1-11-1-',
        '1----1-',
        '1----1-',
        '1----1-',
        '1----1-',
        '-------',
      ],
      N: [
        '1----1-',
        '11---1-',
        '1-1--1-',
        '1--1-1-',
        '1---11-',
        '1----1-',
        '1----1-',
        '-------',
      ],
      O: [
        '-1111--',
        '1----1-',
        '1----1-',
        '1----1-',
        '1----1-',
        '1----1-',
        '-1111--',
        '-------',
      ],
      P: [
        '11111--',
        '1----1-',
        '1----1-',
        '11111--',
        '1------',
        '1------',
        '1------',
        '-------',
      ],
      Q: [
        '-1111--',
        '1----1-',
        '1----1-',
        '1----1-',
        '1--1-1-',
        '1---1--',
        '-111-1-',
        '-------',
      ],
      R: [
        '11111--',
        '1----1-',
        '1----1-',
        '11111--',
        '1--1---',
        '1---1--',
        '1----1-',
        '-------',
      ],
      S: [
        '-1111--',
        '1----1-',
        '1------',
        '-1111--',
        '-----1-',
        '1----1-',
        '-1111--',
        '-------',
      ],
      T: [
        '11111-',
        '--1---',
        '--1---',
        '--1---',
        '--1---',
        '--1---',
        '--1---',
        '------',
      ],
      U: [
        '1----1-',
        '1----1-',
        '1----1-',
        '1----1-',
        '1----1-',
        '1----1-',
        '-1111--',
        '-------',
      ],
      V: [
        '1----1-',
        '1----1-',
        '1----1-',
        '1----1-',
        '1----1-',
        '-1--1--',
        '--11---',
        '-------',
      ],
      W: [
        '1----1-',
        '1----1-',
        '1----1-',
        '1----1-',
        '1-11-1-',
        '11--11-',
        '1----1-',
        '-------',
      ],
      X: [
        '1----1-',
        '1----1-',
        '-1--1--',
        '--11---',
        '-1--1--',
        '1----1-',
        '1----1-',
        '-------',
      ],
      Y: [
        '1---1-',
        '1---1-',
        '1---1-',
        '-111--',
        '--1---',
        '--1---',
        '--1---',
        '------',
      ],
      Z: [
        '11111-',
        '----1-',
        '---1--',
        '--1---',
        '-1----',
        '1-----',
        '11111-',
        '------',
      ],
      // a
      a: [
        '------',
        '------',
        '-111--',
        '----1-',
        '-1111-',
        '1---1-',
        '-1111-',
        '------',
      ],
    }

    for (let index = 0; index < textRow1.length; index += 1) {
      console.log('text[index]', textRow1[index]);
      const character = MONOSPACED_FONT[textRow1[index]];
      console.log('character', character);
      const characterWidth = character[0].length;
      console.log('characterWidth', characterWidth);
      const characterHeight = character.length;
      console.log('characterHeight', characterHeight);

      for (let y = 0; y < character.length; y += 1) {
        // for (let x = 0; x < character[y].length; x += 1) {
          let currentLine = display[cursor.y + y];
          currentLine = currentLine.substring(0, cursor.x) + character[y] + currentLine.substring(cursor.x + characterWidth);
          currentLine = currentLine.substring(0, 192); // Cap the line length
          display[cursor.y + y] = currentLine;
        // }
      }

      cursor.x += characterWidth;
    }

    console.log(display)
    this.setState({ display });

  }

  render() {
    const {
      textRow1,
      textRow2,
      textRow3,
      textRow4,
      textColor,
      colorRed,
      colorGreen,
      colorBlue,
      debugText,
      numberOfMessages,
      messageNumber,
      brightnessMin,
      brightnessMax,
      largeFont,
      sendingMessages,
      display,
    } = this.state;

    const progressPercentage = messageNumber / numberOfMessages * 100;

    let characterLimit = 32;
    if (largeFont) {
      characterLimit = 16;
    }

    return (
      <div className={styles.container} data-tid="container">
        <Grid>
          <Row className="show-grid">
            <Col sm={12} md={12}>
              <h2>RHUMC Sign Controller</h2>
            </Col>
          </Row>
          <Row className="show-grid">
            <Col sm={6} md={6}>
              <h3>Text Rows</h3>
              <FormGroup>
                <Checkbox checked={largeFont} onChange={this.handleFontChange}>Large Font</Checkbox>
              </FormGroup>
              <FormGroup
                controlId="row1Text"
                validationState={this.getValidationStateRow1()}
                >
                <FormControl
                  type="text"
                  value={textRow1}
                  placeholder="Enter text"
                  onChange={this.updateRow1Text}
                  />
                <FormControl.Feedback />
                {textRow1.length > characterLimit && <HelpBlock>{characterLimit} character limit</HelpBlock>}
              </FormGroup>
              <FormGroup
                controlId="row2Text"
                validationState={this.getValidationStateRow2()}
                >
                <FormControl
                  type="text"
                  value={textRow2}
                  placeholder="Enter text"
                  onChange={this.updateRow2Text}
                  />
                <FormControl.Feedback />
                {textRow2.length > characterLimit && <HelpBlock>{characterLimit} character limit</HelpBlock>}
              </FormGroup>
              {!largeFont &&
                <FormGroup
                  controlId="row3Text"
                  validationState={this.getValidationStateRow3()}
                  >
                  <FormControl
                    type="text"
                    value={textRow3}
                    placeholder="Enter text"
                    onChange={this.updateRow3Text}
                    />
                  <FormControl.Feedback />
                  {textRow3.length > characterLimit && <HelpBlock>{characterLimit} character limit</HelpBlock>}
                </FormGroup>
              }
              {!largeFont &&
                <FormGroup
                  controlId="row4Text"
                  validationState={this.getValidationStateRow4()}
                  >
                  <FormControl
                    type="text"
                    value={textRow4}
                    placeholder="Enter text"
                    onChange={this.updateRow4Text}
                    />
                  <FormControl.Feedback />
                  {textRow4.length > characterLimit && <HelpBlock>{characterLimit} character limit</HelpBlock>}
                </FormGroup>
              }
            </Col>
            <Col sm={4} md={4}>
              <h3>Text Color</h3>
              <FormGroup>
                <Checkbox checked={colorRed} onChange={this.handleColorRedChange}>Red</Checkbox>
              </FormGroup>
              <FormGroup>
                <Checkbox checked={colorGreen} onChange={this.handleColorGreenChange}>Green</Checkbox>
              </FormGroup>
              <FormGroup>
                <Checkbox checked={colorBlue} onChange={this.handleColorBlueChange}>Blue</Checkbox>
              </FormGroup>
              {/* <SketchPicker
                className={styles["color-picker"]}
                color={textColor}
                onChangeComplete={this.handleTextColorChange}
                >
              </SketchPicker> */}
            </Col>
            <Col sm={2} md={2}>
              <h3>Brightness</h3>
              <h4>Max (at daylight)</h4>
              <FormGroup
                controlId="maxBrightness"
                validationState={this.getValidationStateMaxBrightness()}
                >
                <FormControl
                  type="text"
                  value={brightnessMax}
                  onChange={this.updateMaxBrightness}
                  />
                <FormControl.Feedback />
                {(brightnessMax > 255 || brightnessMax < 100) && <HelpBlock>Brightness should be within 100 - 255</HelpBlock>}
              </FormGroup>
              <h4>Min (at night)</h4>
              <FormGroup
                controlId="minBrightness"
                validationState={this.getValidationStateMinBrightness()}
                >
                <FormControl
                  type="text"
                  value={brightnessMin}
                  onChange={this.updateMinBrightness}
                  />
                <FormControl.Feedback />
                {(brightnessMin > 200 || brightnessMin < 10) && <HelpBlock>Brightness should be within 10 - 200</HelpBlock>}
              </FormGroup>
            </Col>
          </Row>
          <Row className="show-grid">
            <Col sm={12} md={12}>
              <h3>Commands</h3>
              <ButtonToolbar>
                <Button onClick={this.sendText} disabled={sendingMessages}>Send Text</Button>
                <Button onClick={this.sendBrightness} disabled={sendingMessages}>Send Brightness</Button>
                <Button onClick={this.clearScreen} disabled={sendingMessages}>Clear Screen</Button>
                <Button onClick={this.testing} disabled={sendingMessages}>testing</Button>
                {/* <button>Undo</button> */}
              </ButtonToolbar>
            </Col>
          </Row>
          <Row>
            {display.map((row) => {
              const rowArray = row.split('');
              let rowButtons = rowArray.map((pixel) => {
                // className={styles.container}
                const className = pixel === '1' ? styles['pixel-on'] : styles['pixel-off'];
                // className += 
                return (<button className={pixel === '1' ? styles['pixel-on'] : styles['pixel-off']}>{' '}</button>)
              })
              return (<Col className={styles['pixel-row']} sm={12} md={12}>{rowButtons}</Col>)
            })}
          </Row>
          {sendingMessages &&
            <Row className="show-grid">
              <Col sm={12} md={12}>
                <h3>Progress</h3>
                <h4>{debugText}</h4>
                <ProgressBar active now={progressPercentage} />
              </Col>
            </Row>
          }
          {/* <Link to={routes.COUNTER}>to Counter</Link> */}
        </Grid>
      </div>
    );
  }
}
