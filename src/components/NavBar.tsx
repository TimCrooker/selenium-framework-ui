'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';

const NavBar: React.FC = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
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
};

export default NavBar;
