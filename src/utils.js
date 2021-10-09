import _ from 'lodash';

const urlToFilename = (url, ext = '.html') => {
  const { pathname, hostname } = url;
  const pathComponents = pathname.split('.');
  const preparedUrl = _.trim(`${hostname}${pathComponents[0]}`, '/');
  const filename = preparedUrl.replace(/[\W_]+/g, '-');

  return ((pathComponents.length > 1) ? `${filename}.${pathComponents.slice(1).join('.')}` : `${filename}${ext}`);
};

export default urlToFilename;
