
window.SampleStore = {
  async load() {
    const response = await fetch("../assets/data/sample-data.json".replace("..",".")); // fallback for root page
    return response.json();
  }
};
