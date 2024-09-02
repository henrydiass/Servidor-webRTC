const signalingServer = new WebSocket('wss://c5e2-2804-58-8424-7600-a3-6a37-d7de-4c4b.ngrok-free.app');

signalingServer.onopen = () => {
  console.log('Conectado ao servidor de sinalização');
};

signalingServer.onmessage = async message => {
  const data = await message.data.text().then(text => JSON.parse(text));

  if (data.type === 'answer') {
    peerConnection.setRemoteDescription(new RTCSessionDescription(data));
  } else if (data.type === 'candidate') {
    peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
};

const peerConnection = new RTCPeerConnection();

peerConnection.onicecandidate = event => {
  if (event.candidate) {
    signalingServer.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
  }
};

navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
  .then(stream => {
    console.log(stream);
    const localVideoElement = document.getElementById('localVideo');
    localVideoElement.srcObject = stream;
    localVideoElement.play();

    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    peerConnection.createOffer().then(offer => {
      peerConnection.setLocalDescription(offer);
      signalingServer.send(JSON.stringify(offer));
    });
  })
  .catch(error => {
    console.error('Erro ao capturar mídia:', error);
  });