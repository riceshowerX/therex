/**
 * 第三方模块类型声明
 */

declare module 'input-otp' {
  import { ComponentProps, Context } from 'react';

  export interface OTPSlot {
    char: string | null;
    isActive: boolean;
    hasFakeCaret?: boolean;
  }

  export interface OTPInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    maxLength: number;
    value?: string;
    onChange?: (value: string) => void;
    containerClassName?: string;
    render?: (props: { slots: OTPSlot[] }) => React.ReactNode;
  }

  export const OTPInput: React.ForwardRefExoticComponent<OTPInputProps & React.RefAttributes<HTMLInputElement>>;

  export interface OTPInputContextValue {
    slots: OTPSlot[];
    value: string;
    maxLength: number;
    isHovered: boolean;
    isFocused: boolean;
    isInvalid: boolean;
  }

  export const OTPInputContext: Context<OTPInputContextValue>;
}
