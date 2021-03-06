import type { ExtendedOptions, PageFile, NextErrorFile } from '../commonTypes';
import { loadPageIfExists } from '../loadPage';
import { FOUR_O_FOUR_PATH } from '../constants';
import { getErrorFile } from '../_error/getErrorFile';

export function get404File({
  options,
}: {
  options: ExtendedOptions;
}): PageFile<NextErrorFile> {
  const custom404file = loadPageIfExists<NextErrorFile>({
    pagePath: FOUR_O_FOUR_PATH,
    options,
  });

  if (custom404file) {
    return custom404file;
  }

  // Fallback to "/pages/_error" if no "/pages/404" is present
  return getErrorFile({ options });
}
