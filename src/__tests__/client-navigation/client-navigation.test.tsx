import React from 'react';
import { render as TLRender, waitFor, screen } from '@testing-library/react';
import { getPage } from '../../../src';
import { expectDOMElementsToMatch, renderWithinNextRoot } from '../__utils__';
import PageB from './__fixtures__/pages/b';
import userEvent from '@testing-library/user-event';
import type { NextRouter } from 'next/router';

const nextRoot = __dirname + '/__fixtures__';

describe('Client side navigation', () => {
  describe.each`
    title                                   | linkText
    ${'using Link component (with string)'} | ${'Go to B with Link (with string)'}
    ${'using Link component (with object)'} | ${'Go to B with Link (with object)'}
    ${'programmatically (with string)'}     | ${'Go to B programmatically (with string)'}
    ${'programmatically (with object)'}     | ${'Go to B programmatically (with object)'}
  `('$title', ({ linkText }) => {
    it('navigates between pages', async () => {
      const { render } = await getPage({
        nextRoot,
        route: '/a',
      });
      const { nextRoot: actual } = render();
      screen.getByText('This is page A');

      // Navigate A -> B
      userEvent.click(screen.getByText(linkText));
      await screen.findByText('This is page B');
      expect(screen.queryByText('This is page A')).not.toBeInTheDocument();

      // Ensure router mock update reflects route change
      const { container: expected } = renderWithinNextRoot(
        <PageB
          routerMock={
            ({
              asPath: '/b?foo=bar',
              pathname: '/b',
              query: { foo: 'bar' },
              route: '/b',
              basePath: '',
            } as unknown) as NextRouter
          }
        />
      );
      expectDOMElementsToMatch(actual, expected);
    });

    it('GIP navigates between pages ', async () => {
      const { render } = await getPage({
        nextRoot,
        route: `/gip/a`,
      });
      render();

      screen.getByText(
        JSON.stringify({
          isWindowDefined: false,
          isDocumentDefined: false,
          isReqDefined: true,
          isResDefined: true,
        })
      );

      userEvent.click(screen.getByText(linkText));

      await screen.findByText('This is page B');
      screen.getByText(
        JSON.stringify({
          isWindowDefined: true,
          isDocumentDefined: true,
          isReqDefined: false,
          isResDefined: false,
        })
      );
    });

    it('SSR navigates between pages ', async () => {
      const { render } = await getPage({
        nextRoot,
        route: `/ssr/a`,
      });
      render();

      await screen.findByText(
        JSON.stringify({
          isWindowDefined: false,
          isDocumentDefined: false,
          isReqDefined: true,
          isResDefined: true,
        })
      );

      userEvent.click(screen.getByText(linkText));

      await screen.findByText('This is page B');
      screen.getByText(
        JSON.stringify({
          isWindowDefined: false,
          isDocumentDefined: false,
          isReqDefined: true,
          isResDefined: true,
        })
      );
    });
  });

  it('does not re-render (does not update router mock) if page gets unmounted', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementationOnce(() => {});
    const { page } = await getPage({
      nextRoot,
      route: '/a',
    });

    const { unmount } = TLRender(page);
    userEvent.click(screen.getByText('Go to B with Link (with string)'));

    unmount();

    await waitFor(() => {
      expect(warn).toHaveBeenCalledWith(
        '[next-page-tester] Un-awaited client side navigation from "/a" to "/b?foo=bar". This might lead into unexpected bugs and errors.'
      );
    });

    warn.mockRestore();
  });
});
