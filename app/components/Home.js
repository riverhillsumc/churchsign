// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes';
import styles from './Home.css';

type Props = {};

export default class Home extends Component<Props> {
  props: Props;

  // 3 input fields
  // RGB color picker
  // Send button
  // Clear Screen button
  // Undo button

  // width X height
  // Screen - 192 X 40
  // Small Font - 5 X 8
  // Large Font - 10 X 16

  constructor() {
    super();
    this.state = {
      debugText: '',
      largeFont: true,
      textRow1: '',
      textRow2: '',
      textRow3: '',
      textRow4: '',
      colorRed: 200,
      colorGreen: 200,
      colorBlue: 200,
      brightnessMax: 230,
      brightnessMin: 50
    }
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

  clearAll = () => {
    const params = '"command":"clearall"';
    this.putHTML(params);
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

  updateColor = () => { // rgb: 1=red, 2=green, 3=blue
    const red1 = document.getElementById("Red1").value;
    const gre1 = document.getElementById("Green1").value;
    const blu1 = document.getElementById("Blue1").value;
    const params = `"color":[${red1} ,${gre1}, ${blu1}]`;
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

  updateRedColor = (event) => {
    this.setState({colorRed: event.target.value});
  }
  
  updateGreenColor = (event) => {
    this.setState({colorGreen: event.target.value});
  }
  
  updateBlueColor = (event) => {
    this.setState({colorBlue: event.target.value});
  }
  
  handleFontChange = (event) => {
    this.setState({largeFont: event.target.checked})
  }

  sendText = () => {
    const {
      textRow1,
      textRow2,
      textRow3,
      textRow4,
      colorRed,
      colorGreen,
      colorBlue,
      largeFont,
    } = this.state;

    console.log('send text')
    console.log(textRow1)
    console.log(textRow2)
    console.log(textRow3)
    console.log(textRow4)

    // Commands
    const messages = []
    messages.push('"command": "clearall"'); // Sending clear all
    messages.push(`"color": [${colorRed}, ${colorGreen}, ${colorBlue}]`); // Sending color
    messages.push('"cursor": [0,1]'); // Moving the cursor to the row 1

    // Larger Font
    if (largeFont) {
      messages.push(`"width": "0", "fontsize": "2", "text": "${textRow1}"`); // Entering row 1
      messages.push('"cursor": [0, 20]'); // Moving the cursor to the row 2
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
    this.setState({debugText: messages})
    this.putHTML(messages, false)
  }

  render() {
    const {textRow1, textRow2, textRow3, textRow4, colorRed, colorGreen, colorBlue, debugText, largeFont} = this.state;

    return (
      <div className={styles.container} data-tid="container">
        <h2>RHUMC Sign Controller</h2>
        <h3>Text by row:</h3>
        <span>
          Large Font:
          <input
            name="isGoing"
            type="checkbox"
            checked={largeFont}
            onChange={this.handleFontChange} />
        </span>
        <br/>
        <br/>
        <span className={styles['row-label']}>Row 1:</span>
        <input className={styles['row-text']} defaultValue='' value={textRow1} onChange={this.updateRow1Text} />
        <br/>
        <span className={styles['row-label']}>Row 2:</span>
        <input className={styles['row-text']} defaultValue='' value={textRow2} onChange={this.updateRow2Text} />
        <br/>
        {!largeFont &&
          <div>
            <span className={styles['row-label']}>Row 3:</span>
            <input className={styles['row-text']} defaultValue='' value={textRow3} onChange={this.updateRow3Text} />
            <br/>
            <span className={styles['row-label']}>Row 4:</span>
            <input className={styles['row-text']} defaultValue='' value={textRow4} onChange={this.updateRow4Text} />
          </div>
        }

        <h3>Color:</h3>
        <div className={styles['color-label']}>
          Red
        </div>
        <input className={styles['color-slider']} type="range" min="0" max="255" onChange={this.updateRedColor} value={colorRed} />
        <span>{colorRed}</span>
        <br/>
        <div className={styles['color-label']}>
          Green
        </div>
          <input className={styles['color-slider']} type="range" min="0" max="255" onChange={this.updateGreenColor} value={colorGreen} />
        <span>{colorGreen}</span>
        <br/>
        <div className={styles['color-label']}>
          Blue
        </div>
        <input className={styles['color-slider']} type="range" min="0" max="255" onChange={this.updateBlueColor} value={colorBlue} />
        <span>{colorBlue}</span>

        <br/>
        <br/>
        <button type="button" onClick={this.sendText}>Send Text</button>
        {/* <button>Clear All</button> */}
        {/* <button>Undo</button> */}

        {/* <br/>
        <h3>Debug</h3>
        <span>{debugText}</span> */}

        {/* <Link to={routes.COUNTER}>to Counter</Link> */}
      </div>
    );
  }
}
