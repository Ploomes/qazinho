import type { IErrorBarrierProps, IErrorBarrierState } from './types';
import { Component } from 'react';
import { BrokenRegion } from './components';

/** Segura o erro de render de uma região: ela vira um aviso, e o resto segue. */
export class ErrorBarrier extends Component<IErrorBarrierProps, IErrorBarrierState> {
  public state: IErrorBarrierState = { error: null };

  public static getDerivedStateFromError(error: unknown): IErrorBarrierState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  /** O aviso da região quebrada no lugar dela, ou a região inteira. */
  public render(): React.ReactNode {
    if (this.state.error === null) return this.props.children;

    return (
      <BrokenRegion
        region={this.props.region}
        error={this.state.error}
        onRetry={this.retry}
      />
    );
  }

  private readonly retry = (): void => {
    this.setState({ error: null });
  };
}
