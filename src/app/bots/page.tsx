'use client';

import React, { useEffect, useState } from 'react';
import { Bot } from '../../types';
import Link from 'next/link';
import apiClient from '@/utils/apiClient'

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
  }, []);

  return (
    <div>
      <h1>Bots List</h1>
      <ul>
        {bots.map((bot) => (
          <li key={bot.id}>
            <Link href={`/bots/${bot.id}`}>
              {bot.name} - Status: {bot.status}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BotsList;
