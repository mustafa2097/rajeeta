import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import ConnectScreen from './src/screens/ConnectScreen';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  const [connected, setConnected] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [pin, setPin] = useState('');

  if (!connected) {
    return (
      <>
        <StatusBar style="light" />
        <ConnectScreen
          onConnected={(url, p) => {
            setServerUrl(url);
            setPin(p);
            setConnected(true);
          }}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <HomeScreen
        serverUrl={serverUrl}
        pin={pin}
        onDisconnect={() => setConnected(false)}
      />
    </>
  );
}
