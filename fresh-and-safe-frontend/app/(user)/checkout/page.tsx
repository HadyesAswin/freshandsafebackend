import CheckoutDesktop from './CheckoutDesktop';
import CheckoutMobile from './CheckoutMobile';

export default function CheckoutPage() {
  return (
    <>
      <div className="hidden md:block">
        <CheckoutDesktop />
      </div>
      <div className="md:hidden">
        <CheckoutMobile />
      </div>
    </>
  );
}