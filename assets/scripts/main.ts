document.addEventListener('DOMContentLoaded', function () {
  // show all elements with .javascript-enable class
  document.querySelectorAll('.javascript-enable').forEach((element) => {
    // remove the hidden attribute
    element.removeAttribute('hidden');
  });

  // hide all elements with .javascript-disable class
  document.querySelectorAll('.javascript-disable').forEach((element) => {
    // add the hidden attribute
    element.setAttribute('hidden', '');
  });

  const audios = document.querySelectorAll('audio');
  audios.forEach((audio) => {
    audio.addEventListener('play', () => {
      audios.forEach((otherAudio) => {
        if (otherAudio !== audio) {
          otherAudio.pause();
        }
      });
    });
  });
});
