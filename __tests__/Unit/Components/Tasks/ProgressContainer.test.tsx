import { store } from '@/app/store';
import ProgressContainer from '@/components/tasks/card/progressContainer';
import { renderWithRouter } from '@/test_utils/createMockRouter';
import { CONTENT } from '../../../../__mocks__/db/tasks';
import { Provider } from 'react-redux';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import handlers from '../../../../__mocks__/handlers';
import { setupServer } from 'msw/node';
import { superUserSelfHandler } from '../../../../__mocks__/handlers/self.handler';
import selfHandler from '../../../../__mocks__/handlers/self.handler';
import {
    failedUpdateTaskHandler,
    failedUpdateSelfTaskHandler,
} from '../../../../__mocks__/handlers/tasks.handler';
import { ToastContainer } from 'react-toastify';

const server = setupServer(...handlers);

describe('ProgressContainer', () => {
    beforeAll(() => {
        server.listen();
    });
    afterEach(() => {
        server.resetHandlers();
    });
    afterAll(() => {
        server.close();
    });

    test('should render progress bar component when user is a super user', async () => {
        server.use(superUserSelfHandler);
        renderWithRouter(
            <Provider store={store()}>
                <ProgressContainer content={CONTENT[0]} />
                <ToastContainer />
            </Provider>,
            {
                query: { dev: 'true' },
            }
        );
        await waitFor(() => {
            expect(screen.getByText('0%')).toBeInTheDocument();
            expect(screen.getByText('UPDATE')).toBeInTheDocument();
        });
        const updateButton = screen.getByRole('button', { name: /UPDATE/i });
        fireEvent.click(updateButton);
        const sliderInput = screen.getByRole('slider');
        fireEvent.change(sliderInput, { target: { value: 50 } });
        expect(screen.getByText('50%')).toBeInTheDocument();
        fireEvent.mouseDown(sliderInput);
        fireEvent.mouseUp(sliderInput);
        await waitFor(
            () => {
                expect(
                    screen.getByText('Progress Updated Successfully')
                ).toBeInTheDocument();
            },
            {
                timeout: 2000,
            }
        );
    });
    test('should render progress bar component when user is a assignee', async () => {
        server.use(...selfHandler);
        renderWithRouter(
            <Provider store={store()}>
                <ProgressContainer content={CONTENT[0]} />
                <ToastContainer />
            </Provider>,
            {
                query: { dev: 'true' },
            }
        );
        await waitFor(() => {
            expect(screen.getByText('0%')).toBeInTheDocument();
            expect(screen.getByText('UPDATE')).toBeInTheDocument();
        });
        const updateButton = screen.getByRole('button', { name: /UPDATE/i });
        fireEvent.click(updateButton);
        const sliderInput = screen.getByRole('slider');
        fireEvent.change(sliderInput, { target: { value: 50 } });
        expect(screen.getByText('50%')).toBeInTheDocument();
        fireEvent.mouseDown(sliderInput);
        fireEvent.mouseUp(sliderInput);
        await waitFor(
            () => {
                expect(
                    screen.getByText('Progress Updated Successfully')
                ).toBeInTheDocument();
            },
            {
                timeout: 2000,
            }
        );
    });

    test('should render error message when super user is updating progress', async () => {
        server.use(superUserSelfHandler);
        server.use(failedUpdateTaskHandler);
        renderWithRouter(
            <Provider store={store()}>
                <ProgressContainer content={CONTENT[0]} />
                <ToastContainer />
            </Provider>,
            {
                query: { dev: 'true' },
            }
        );
        await waitFor(() => {
            expect(screen.getByText('0%')).toBeInTheDocument();
            expect(screen.getByText('UPDATE')).toBeInTheDocument();
        });
        const updateButton = screen.getByRole('button', { name: /UPDATE/i });
        fireEvent.click(updateButton);
        const sliderInput = screen.getByRole('slider');
        fireEvent.change(sliderInput, { target: { value: 50 } });
        expect(screen.getByText('50%')).toBeInTheDocument();
        fireEvent.mouseDown(sliderInput);
        fireEvent.mouseUp(sliderInput);
        await waitFor(
            () => {
                expect(
                    screen.getByText('Something went wrong!')
                ).toBeInTheDocument();
            },
            {
                timeout: 2000,
            }
        );
    });
    test('should render error message when assignee is updating progress', async () => {
        server.use(...selfHandler);
        server.use(failedUpdateSelfTaskHandler);
        renderWithRouter(
            <Provider store={store()}>
                <ProgressContainer content={CONTENT[0]} />
                <ToastContainer />
            </Provider>,
            {
                query: { dev: 'true' },
            }
        );
        await waitFor(() => {
            expect(screen.getByText('0%')).toBeInTheDocument();
            expect(screen.getByText('UPDATE')).toBeInTheDocument();
        });
        const updateButton = screen.getByRole('button', { name: /UPDATE/i });
        fireEvent.click(updateButton);
        const sliderInput = screen.getByRole('slider');
        fireEvent.change(sliderInput, { target: { value: 50 } });
        expect(screen.getByText('50%')).toBeInTheDocument();
        fireEvent.mouseDown(sliderInput);
        fireEvent.mouseUp(sliderInput);
        await waitFor(
            () => {
                expect(
                    screen.getByText('Something went wrong!')
                ).toBeInTheDocument();
            },
            {
                timeout: 2000,
            }
        );
    });

    test('should not render UPDATE button if the user is not the assignee or a super user', async () => {
        server.use(...selfHandler);
        server.use(failedUpdateSelfTaskHandler);
        renderWithRouter(
            <Provider store={store()}>
                <ProgressContainer content={CONTENT[1]} />
            </Provider>,
            {
                query: { dev: 'true' },
            }
        );
        screen.debug();
        await waitFor(() => {
            expect(screen.getByText('0%')).toBeInTheDocument();
            expect(screen.queryByText('UPDATE')).not.toBeInTheDocument();
        });
    });
});
