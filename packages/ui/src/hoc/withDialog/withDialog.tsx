import type { DialogProps as MuiDialogProps } from '@mui/material';
import type {
  ComponentClass,
  ComponentType,
  RefObject,
} from 'react';
import {
  Component,
  createRef,
} from 'react';

import { Dialog } from '../../components/ui/Dialog';
import type {
  DialogAction,
  DialogProps,
} from '../../components/ui/Dialog';

export type WithDialogOptions = {
  defaultTitle?: string;
  disableBackdropClick?: boolean;
  noCloseButton?: boolean;
  noTitle?: boolean;
  testId?: string;
} & Pick<DialogProps, 'fullScreen' | 'fullWidth' | 'maxWidth' | 'noPadding' | 'titleVariant'>;

export interface WithDialogRefMethods<TProps extends WithDialogRenderProps<TOpenProps>, TOpenProps = never> extends Component<TProps, WithDialogState<TOpenProps>> {
  close: () => void;
  open: (props?: TOpenProps) => void;
}

export type WithDialogRenderProps<TOpenProps = never> = {
  dialogContentRef?: RefObject<HTMLDivElement>;
  maxWidth?: MuiDialogProps['maxWidth'];
  onActionsChange?: (config: DialogAction[]) => void;
  onClose?: () => void;
  onPermalinkChange?: (permalink: string) => void;
  onTitleChange?: (title: string) => void;
  openProps?: TOpenProps;
  permalink?: string;
  title?: string;
};

export interface WithDialogState<TOpenProps> {
  actions: DialogAction[];
  isOpen: boolean;
  openProps: TOpenProps;
  permalink: string;
  title: string;
}

export const withDialog = <TProps extends WithDialogRenderProps<TOpenProps>, TOpenProps = never>(Content: ComponentType<TProps>, withDialogOptions: WithDialogOptions = {}): ComponentClass<TProps, WithDialogState<TOpenProps>> => {
  // eslint-disable-next-line @eslint-react/no-class-component
  return class WithDialog extends Component<TProps, WithDialogState<TOpenProps>> implements WithDialogRefMethods<TProps, TOpenProps> {
    private readonly dialogContentRef: RefObject<HTMLDivElement>;

    public constructor(props: TProps) {
      super(props);
      this.state = {
        actions: null,
        isOpen: false,
        openProps: undefined,
        permalink: props.permalink,
        title: props.title || withDialogOptions?.defaultTitle,
      };
      this.onClose = this.onClose.bind(this);
      this.onPermalinkChange = this.onPermalinkChange.bind(this);
      this.onTitleChange = this.onTitleChange.bind(this);
      this.onActionsChange = this.onActionsChange.bind(this);
      this.dialogContentRef = createRef<HTMLDivElement>();
    }

    public close(): void {
      this.setState({ isOpen: false });
    }

    // eslint-disable-next-line @eslint-react/no-unused-class-component-members
    public open(openProps: TOpenProps): void {
      this.setState({ isOpen: true, openProps });
    }

    public render() {
      const { isOpen } = this.state;
      if (!isOpen) {
        return null;
      }

      return (
        <Dialog
          actions={this.state.actions}
          dialogContentRef={this.dialogContentRef}
          disableBackdropClick={withDialogOptions?.disableBackdropClick}
          fullScreen={withDialogOptions.fullScreen}
          fullWidth={withDialogOptions.fullWidth}
          maxWidth={withDialogOptions.maxWidth}
          noCloseButton={withDialogOptions?.noCloseButton}
          noPadding={withDialogOptions.noPadding}
          noTitle={withDialogOptions?.noTitle}
          onClose={this.onClose}
          permalink={this.state.permalink}
          testId={withDialogOptions?.testId}
          title={this.state.title}
          titleVariant={withDialogOptions?.titleVariant}
        >
          <Content
            {...this.props}
            dialogContentRef={this.dialogContentRef}
            onActionsChange={this.onActionsChange}
            onClose={this.onClose}
            onPermalinkChange={this.onPermalinkChange}
            onTitleChange={this.onTitleChange}
            openProps={this.state.openProps}
          />
        </Dialog>
      );
    }

    private onActionsChange(actions: DialogAction[]): void {
      this.setState({ actions });
    }

    private onClose(): void {
      this.close();
      this.props.onClose?.();
    }

    private onPermalinkChange(permalink: string): void {
      this.setState({ permalink });
    }

    private onTitleChange(title: string): void {
      this.setState({ title });
    }
  };
};
