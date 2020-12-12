import React from 'react';
import './App.css';
import Header from './Components/Header';
import Home from './Components/Home';
import SignIn from './Components/SignIn';
import Dashboard from './Components/Dashboard';
import Servers from './Components/Servers';
import ServerDetail from './Components/ServerDetail';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom';

function App() {
  return (
    <Router>
      <Header />
      <Switch> 
        <Route path="/" exact component={Home} />
        <Route path="/signIn" component={SignIn} />
        <Route path="/dashboard" component={Dashboard}/>
        <Route path="/servers" exact component={Servers}/>
        <Route path="/servers/:id" component={ServerDetail}/>
      </Switch>
    </Router>
    
  );
}

export default App;
