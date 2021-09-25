export default (url) => {
  const myURL = new URL(url);
  const parsedUrl = `${myURL.hostname.split('.').join('-')}-${myURL.pathname.slice(1)}`;

  return parsedUrl;
};
