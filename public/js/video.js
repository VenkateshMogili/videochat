(function() {
  /** @type {SocketIOClient.Socket} */
  const socket = io.connect(window.location.origin);
  const localVideo = document.querySelector('.localVideo');
  const remoteVideos = document.querySelector('.remoteVideos');
  const callend = document.querySelector('.callend');
  const mute = document.getElementById("mute");
  const unmute = document.getElementById("unmute");
  const share = document.getElementById("share");
  const peerConnections = {};

  let room = !location.pathname.substring(1) ? 'home' : location.pathname.substring(1);
  let getUserMediaAttempts = 5;
  let gettingUserMedia = false;

  /** @type {RTCConfiguration} */
  const config = {
    'iceServers': [{
      'urls': ['stun:stun.l.google.com:19302']
    }]
  };

  /** @type {MediaStreamConstraints} */
  const constraints = {
    audio: true,
    video: { facingMode: "user" }
  };

  socket.on('full', function(room) {
    alert('Room ' + room + ' is full');
  });

  mute.addEventListener('click',(e)=>{
    mute.style.display='none';
    unmute.style.display='inline-block';
    localVideo.muted = true;
  });

  unmute.addEventListener('click',(e)=>{
    unmute.style.display='none';
    mute.style.display='inline-block';
    localVideo.muted = false;
  });

  callend.addEventListener('click',(e)=>{
    window.location.href="/";
  });

  share.addEventListener("click",(e)=>{
    let shared_url = 'To join the video meeting, click this link:%0Ahttps://online-video-chat.herokuapp.com'+location.pathname;
    let shared_url2 = 'To join the video meeting, click this link:\nhttps://online-video-chat.herokuapp.com'+location.pathname;
    let os = getOS();
    if(os=='Android' || os=='iOS'){
    navigator.clipboard.writeText(shared_url2).then(function() {
      alert('Copied Meeting URL Successfully');
    }, function(err) {
      alert('Something went wrong');
    });
    } else{
      window.open('https://web.whatsapp.com/send?text=' + shared_url, "_blank", "toolbar=yes,scrollbars=yes,resizable=yes,top=0,left=0,width=1000,height=500");
    }
  });


  function getOS() {
    var userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
        iosPlatforms = ['iPhone', 'iPad', 'iPod'],
        os = null;

    if (macosPlatforms.indexOf(platform) !== -1) {
      os = 'Mac OS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      os = 'iOS';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      os = 'Windows';
    } else if (/Android/.test(userAgent)) {
      os = 'Android';
    } else if (!os && /Linux/.test(platform)) {
      os = 'Linux';
    }

    return os;
  }

  socket.on('bye', function(id) {
    handleRemoteHangup(id);
  });

  if (room && !!room) {
    socket.emit('join', room);
  }

  window.onunload = window.onbeforeunload = function() {
    socket.close();
  };

  socket.on('ready', function (id) {
    if (!(localVideo instanceof HTMLVideoElement) || !localVideo.srcObject) {
      return;
    }
    const peerConnection = new RTCPeerConnection(config);
    peerConnections[id] = peerConnection;
    if (localVideo instanceof HTMLVideoElement) {
      peerConnection.addStream(localVideo.srcObject);
    }
    peerConnection.createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(function () {
      socket.emit('offer', id, peerConnection.localDescription);
    });
    peerConnection.onaddstream = event => handleRemoteStreamAdded(event.stream, id);
    peerConnection.onicecandidate = function(event) {
      if (event.candidate) {
        socket.emit('candidate', id, event.candidate);
      }
    };
  });

  socket.on('offer', function(id, description) {
    const peerConnection = new RTCPeerConnection(config);
    peerConnections[id] = peerConnection;
    if (localVideo instanceof HTMLVideoElement) {
      peerConnection.addStream(localVideo.srcObject);
    }
    peerConnection.setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(function () {
      socket.emit('answer', id, peerConnection.localDescription);
    });
    peerConnection.onaddstream = event => handleRemoteStreamAdded(event.stream, id);
    peerConnection.onicecandidate = function(event) {
      if (event.candidate) {
        socket.emit('candidate', id, event.candidate);
      }
    };
  });

  socket.on('candidate', function(id, candidate) {
    peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));
  });

  socket.on('answer', function(id, description) {
    peerConnections[id].setRemoteDescription(description);
  });

  function getUserMediaSuccess(stream) {
    gettingUserMedia = false;
    if (localVideo instanceof HTMLVideoElement) {
      !localVideo.srcObject && (localVideo.srcObject = stream);
    }
    socket.emit('ready');
  }

  function handleRemoteStreamAdded(stream, id) {
    const remoteVideo = document.createElement('video');
    remoteVideo.srcObject = stream;
    remoteVideo.setAttribute("id", id.replace(/[^a-zA-Z]+/g, "").toLowerCase());
    remoteVideo.setAttribute("playsinline", "true");
    remoteVideo.setAttribute("autoplay", "true");
    remoteVideos.appendChild(remoteVideo);
    if (remoteVideos.querySelectorAll("video").length === 1) {
      remoteVideos.setAttribute("class", "one remoteVideos");
    } else {
      remoteVideos.setAttribute("class", "remoteVideos");
    }
  }

  function getUserMediaError(error) {
    console.error(error);
    gettingUserMedia = false;
    (--getUserMediaAttempts > 0) && setTimeout(getUserMediaDevices, 1000);
  }

  function getUserMediaDevices() {
    if (localVideo instanceof HTMLVideoElement) {
      if (localVideo.srcObject) {
        getUserMediaSuccess(localVideo.srcObject);
      } else if (!gettingUserMedia && !localVideo.srcObject) {
        gettingUserMedia = true;
        navigator.mediaDevices.getUserMedia(constraints)
        .then(getUserMediaSuccess)
        .catch(getUserMediaError);
      }
    }
  }

  function handleRemoteHangup(id) {
    peerConnections[id] && peerConnections[id].close();
    delete peerConnections[id];
    document.querySelector("#" + id.replace(/[^a-zA-Z]+/g, "").toLowerCase()).remove();
    if (remoteVideos.querySelectorAll("video").length === 1) {
      remoteVideos.setAttribute("class", "one remoteVideos");
    } else {
      remoteVideos.setAttribute("class", "remoteVideos");
    }
  }

  getUserMediaDevices();
})();
