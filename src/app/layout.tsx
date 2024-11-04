import NavBar from '@/components/NavBar'
import React from 'react'

export const metadata = {
	title: 'Bot Monitoring App',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<body>
				<NavBar />
				{children}
			</body>
		</html>
	)
}
