'use client';

import React from 'react';
import Link from 'next/link';

const NavBar: React.FC = () => (
  <nav>
    <ul>
      <li>
        <Link href="/bots">Bots</Link>
      </li>
			<li>
				<Link href="/agents">Agents</Link>
			</li>
      <li>
        <Link href="/bots/new">Register Bot</Link>
      </li>
    </ul>
  </nav>
);

export default NavBar;
