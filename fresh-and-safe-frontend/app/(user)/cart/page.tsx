import CartDesktop from './CartDesktop';
import CartMobile from './CartMobile';

export default function CartPage() {
  return (
    <>
      <div className="hidden md:block">
        <CartDesktop />
      </div>
      <div className="md:hidden">
        <CartMobile />
      </div>
    </>
  );
}