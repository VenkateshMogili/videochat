/*global io*/
/** @type {RTCConfiguration} */
const config = { // eslint-disable-line no-unused-vars
  'iceServers': [{
    'urls': ['stun:stun.l.google.com:19302']
  }]
};

const socket = io.connect(window.location.origin);
const video = document.querySelector('video'); // eslint-disable-line no-unused-vars

window.onunload = window.onbeforeunload = function() {
	socket.close();
};
// const socket = io.connect(window.location.origin);
// const peerConnection = new RTCPeerConnection();
// function broadcast() {  // eslint-disable-line no-unused-vars
// 	const video = document.querySelector('video');
// 	const canvas = document.createElement('canvas');
// 	const ctx = canvas.getContext('2d');
// 	navigator.mediaDevices.getUserMedia({
// 		audio:true,
// 		video:true
// 	})
// 	.then((stream)=>{
// 		peerConnection.addStream(stream);
// 		peerConnection.createOffer()
// 		.then(sdp=>peerConnection.setLocalDescription(sdp))
// 		.then(()=>{
// 			socket.emit('offer',peerConnection.localDescription);
// 		});
// 	});
// 	socket.on('answer',(message)=>{
// 		peerConnection.setRemoteDescription(message);
// 	});
// 	// navigator.mediaDevices.getUserMedia({ video : true })
// 	// .then(function(stream) {
// 	// 	video.srcObject = stream;
// 	// 	setInterval(function() {
// 	// 		canvas.width = video.videoWidth;
// 	// 		canvas.height = video.videoHeight;
// 	// 		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
// 	// 		const imageData = canvas.toDataURL("image/png");
// 	// 		socket.emit('sendImage', { image : imageData });
// 	// 	}, 100);
// 	// }).catch(error => console.error(error));
// }

// function watch() {  // eslint-disable-line no-unused-vars
// 	// const img = document.querySelector('img');
// 	const video = document.querySelector('video');

// 	// socket.on('getImage', data => img.src = data.image);
// 	socket.on('offer',(message)=>{
// 		peerConnection.setRemoteDescription(message)
// 		.then(()=>peerConnection.createAnswer())
// 		.then(sdp=>peerConnection.setLocalDescription(sdp))
// 		.then(()=>{
// 			socket.emit('answer',peerConnection.localDescription);
// 		});
// 	});

// 	peerConnection.onaddstream = (event)=>{
// 		video.srcObject = event.stream;
// 	}
// }