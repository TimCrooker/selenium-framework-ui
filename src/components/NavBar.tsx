'use client';

import React from 'react';
import Link from 'next/link';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';

const NavBar: React.FC = () => (
  <AppBar position="static">
    <Toolbar>
      <Typography variant="h6" style={{ flexGrow: 1 }}>
        Bot Monitoring App
      </Typography>
      <Button color="inherit" component={Link} href="/bots">Bots</Button>
      <Button color="inherit" component={Link} href="/agents">Agents</Button>
      <Button color="inherit" component={Link} href="/bots/new">Register Bot</Button>
    </Toolbar>
  </AppBar>
);

export default NavBar;
