const query = process.argv.slice(2).join(' ');

if (!query) {
  console.error('Usage: node spotdown-cli.js <keyword or Spotify URL>');
  process.exit(1);
}

async function getSongDetails(q) {
  try {
    const url = `https://spotdown.org/api/song-details?url=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://spotdown.org/',
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || `HTTP error! status: ${res.status}`);
      } catch (e) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
    }
    
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('❌ Error fetching song details:', err.message);
    return null;
  }
}

(async () => {
  const data = await getSongDetails(query);
  if (!data) return;

  let songs = [];
  if (data.songs && Array.isArray(data.songs)) {
    songs = data.songs;
  } else if (Array.isArray(data)) {
    songs = data;
  } else if (data.title || data.name) {
    songs = [data];
  }

  if (songs.length === 0) {
    if (data.success === false && data.message) {
      console.log('❌ Result:', data.message);
    } else {
      console.log('No songs found.');
    }
    return;
  }

  console.log(`🎵 Found ${songs.length} song(s):`);
  songs.forEach((song, index) => {
    console.log(`\n[${index + 1}]`);
    console.log('Title    :', song.title || song.name || 'Unknown');
    console.log('Artist   :', song.artist || (Array.isArray(song.artists) ? song.artists.join(', ') : 'Unknown'));
    console.log('Duration :', song.duration || 'N/A');
    console.log('URL      :', song.url || 'N/A');
    console.log('Thumbnail:', song.thumbnail || song.cover || 'N/A');
  });
})();