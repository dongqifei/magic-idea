import * as React from 'react';

export interface IMiniProblemStatusBarProps {
  problemCount: number;
  warningCount: number;
}

export class MiniProblemStatusBar extends React.Component<IMiniProblemStatusBarProps> {
  render() {
    return (
      <>
        <div className={`codicon codicon-error`} style={{marginRight: 4}}></div>
        <div>{this.props.problemCount}</div>
        <div className={`codicon codicon-warning`} style={{marginInline: 4}}></div>
        <div>{this.props.warningCount}</div>
      </>
    );
  }
}

