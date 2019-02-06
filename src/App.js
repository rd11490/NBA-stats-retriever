/* global chrome */

import React, {Component} from 'react';
import './App.css';

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            domain: '',
            apiCalls: []
        }
    }

    render() {
        return (
            <div className="App">
                <h1 className="App-title">NBA Data Retriever</h1>
                <a href={'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=F4GWNUKSW5V5G&source=url'} target="_blank">Donate!</a>
            </div>
        );
    }
}

export default App;
