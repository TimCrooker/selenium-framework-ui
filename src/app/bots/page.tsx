'use client';

import React, { useEffect, useState } from 'react';
import { Bot } from '../../types';
import Link from 'next/link';
import apiClient from '@/utils/apiClient';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import cronstrue from 'cronstrue';
import socket from '@/utils/socket';

const BotsList: React.FC = () => {
  const [bots, setBots] = useState<Bot[]>([]);

  useEffect(() => {
    const fetchBots = async () => {
      try {
        const response = await apiClient.get<Bot[]>('/bots');
        setBots(response.data);
      } catch (error) {
        console.error('Error fetching bots:', error);
      }
    };

    fetchBots();

    socket.on('bot_deleted', (data) => {
      setBots((prevBots) => prevBots.filter(bot => bot.id !== data.bot_id));
    });

    socket.on('bot_updated', (updatedBot) => {
      setBots((prevBots) => prevBots.map(bot => bot.id === updatedBot.id ? updatedBot : bot));
    });

    return () => {
      socket.off('bot_deleted');
      socket.off('bot_updated');
    };
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/bots/${id}`);
      setBots(bots.filter(bot => bot.id !== id));
    } catch (error) {
      console.error('Error deleting bot:', error);
    }
  };

  const formatSchedule = (schedule?: string) => {
    if (!schedule) return 'No schedule';
    try {
      return cronstrue.toString(schedule);
    } catch {
      return 'Invalid schedule';
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Bots List</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Script</TableCell>
              <TableCell>Schedule</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bots.map((bot) => (
              <TableRow key={bot.id}>
                <TableCell>
                  <Link href={`/bots/${bot.id}`} passHref>
                    <Typography variant="body1" color="primary">{bot.name}</Typography>
                  </Link>
                </TableCell>
                <TableCell>{bot.script}</TableCell>
                <TableCell>{formatSchedule(bot.schedule)}</TableCell>
                <TableCell>
                  <Button variant="contained" color="secondary" onClick={() => handleDelete(bot.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default BotsList;
