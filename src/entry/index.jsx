import '../common/lib';
import App from '../component/App';
import MENU from '../component/menu';
import App2 from '../component/App2';
import fff from '../component/query';
import ReactDOM from 'react-dom';
import React from 'react';

const ReactRouter = require('react-router');
let { Router, Route, Link, hashHistory } = ReactRouter;
import { Breadcrumb } from 'antd';




ReactDOM.render(
  <Router history={hashHistory}>
     <Route name="app/1"  path="/app1" component={App}/>  
     <Route name="app/2"  path="/app2" component={fff}/>
     <Route name="app/3"  path="/app3" component={App2}/>
     <Route name="detail"  path="detail" />
  </Router>
, document.getElementById('react-content'));


ReactDOM.render(
  <MENU/>
, document.getElementById('MENU'));



