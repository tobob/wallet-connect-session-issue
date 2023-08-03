import { useEffect, useState } from "react";
import "./App.css";
import SignClient from "@walletconnect/sign-client";
import { WalletConnectModal } from "@walletconnect/modal";
import { SessionTypes } from "@walletconnect/types";
import { ethers } from "ethers";
import { UniversalProvider } from "@walletconnect/universal-provider";
import usdcAbi from "./usdcAbi";

const PROJECT_ID = "";
if (PROJECT_ID === "") {
  alert("Please set PROJECT_ID in App.tsx");
}

const walletConnectModal = new WalletConnectModal({
  projectId: PROJECT_ID,
});

const metadata = {
  name: "Example Dapp",
  description: "Example Dapp",
  url: "#",
  icons: ["https://walletconnect.com/walletconnect-logo.png"],
};

function App() {
  const [sessions, setSessions] = useState<SessionTypes.Struct[]>([]);
  const [client, setClient] = useState<SignClient>();

  useEffect(() => {
    const initClient = async () => {
      const signClient = await SignClient.init({
        projectId: PROJECT_ID,
        // optional parameters
        metadata,
      });
      setClient(signClient);
      setSessions(signClient.session.getAll());
    };
    initClient();
  }, []);

  useEffect(() => {
    if (client) {
      client.on("session_update", ({ topic }) => {
        const _session = client.session.get(topic);
        onSessionUpdate(_session);
      });

      client.on("session_delete", ({ topic }) => {
        alert(topic);
        setSessions((prev) => prev.filter((s) => s.topic !== topic));
      });
    }
  }, [client]);

  const onSessionUpdate = (session: any) => {
    setSessions((prev) => {
      const index = prev.findIndex((s) => s.topic === session.topic);
      if (index === -1) {
        return [...prev, session];
      } else {
        const newSessions = [...prev];
        newSessions[index] = session;
        return newSessions;
      }
    });
  };

  const makeNewConnection = async () => {
    try {
      if (!client) return;

      const { uri, approval } = await client.connect({
        // Provide the namespaces and chains (e.g. `eip155` for EVM-based chains) we want to use in this session.
        requiredNamespaces: {
          eip155: {
            methods: ["eth_sendTransaction"],
            chains: ["eip155:1"],
            events: ["chainChanged", "accountsChanged"],
          },
        },
      });

      if (uri) {
        walletConnectModal.openModal({ uri });
        const session = await approval();
        onSessionUpdate(session);
        walletConnectModal.closeModal();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const makePrerequest = async (session: SessionTypes.Struct) => {
    const universalProvider = await UniversalProvider.init({
      projectId: PROJECT_ID,
      metadata,
      client,
      disableProviderPing: true,
      name: "WalletConnect",
    });
    universalProvider.session = session;
    await universalProvider.connect({
      skipPairing: true,
      namespaces: {
        eip155: {
          methods: ["eth_sendTransaction"],
          chains: ["eip155:1"],
          events: ["chainChanged", "accountsChanged"],
        },
      },
      pairingTopic: session.pairingTopic,
    });
    const accounts = await universalProvider
      .request({
        method: "eth_accounts",
        params: [],
      })
      .catch((err) => {
        alert("failed" + JSON.stringify(err));
      });
    const walletConnectProvider = new ethers.BrowserProvider(
      universalProvider,
      "mainnet"
    );
    alert("I will use " + accounts[0] + " address");
    const signer = await walletConnectProvider.getSigner(accounts[0]);
    const amountInHex = ethers.parseUnits("1", 6);
    const usdcContract = new ethers.Contract(
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      usdcAbi,
      signer
    );
    const nonceDecoded = `0x${Date.now().toString(16)}`;
    usdcContract
      .transfer("0xdf60d5C5b8C97FE6A28Ffe896498234Fe03B3cE6", amountInHex, {
        //random eth address
        nonce: nonceDecoded,
        gasLimit: 240000,
      })
      .then((tx: any) => {
        alert("ok");
        return tx;
      })
      .catch((e: any) => {
        alert("error" + JSON.stringify(e));
      });
  };

  if (!client) return <span>Initialization of client</span>;

  return (
    <>
      <div>
        <span>Sessions ({sessions.length}):</span>
        {sessions.map((session) => (
          <div
            style={{
              flexDirection: "row",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div>{session.peer.metadata.name}</div>
            <button onClick={() => makePrerequest(session)}>Send 1 USDC</button>
            <button
              style={{ backgroundColor: "red", opacity: 0.4 }}
              onClick={() => {
                client.session.delete(session.topic, "No reason");
                alert("Please refresh page to see changes");
              }}
            >
              Disconnect
            </button>
          </div>
        ))}
      </div>

      <button style={{ marginTop: "40px" }} onClick={makeNewConnection}>
        Connect Wallet Modal
      </button>
    </>
  );
}

export default App;
