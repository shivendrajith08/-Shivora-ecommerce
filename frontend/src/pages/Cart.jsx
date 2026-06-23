import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import CartItem from '../components/cart/CartItem'
import Loader from '../components/common/Loader'

const Cart = () => {
  const { cartItems, cartTotal, loading } = useCart()
  const navigate = useNavigate()

  if (loading && cartItems.length === 0) return <Loader fullScreen label="Loading your cart..." />

  if (cartItems.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-surface-raised flex items-center justify-center mb-5">
          <svg className="w-10 h-10 text-silver-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.954-4.749 2.466-7.305a1.125 1.125 0 00-1.105-1.345H5.106M7.5 14.25L5.106 5.272M6 18.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm9.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-parchment mb-2">Your cart is empty</h2>
        <p className="text-silver-muted mb-6">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="btn-primary !px-6">Start Shopping</Link>
      </div>
    )
  }

  const shippingFee = cartTotal >= 999 ? 0 : 49
  const finalTotal = cartTotal + shippingFee

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-parchment mb-6">Shopping Cart</h1>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="card overflow-hidden">
          {cartItems.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>

        <div className="card p-5 h-fit sticky top-20">
          <h3 className="font-bold text-parchment mb-4">Order Summary</h3>
          <div className="space-y-2.5 text-sm mb-4">
            <div className="flex justify-between text-silver-muted">
              <span>Subtotal</span>
              <span>₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-silver-muted">
              <span>Shipping</span>
              <span>{shippingFee === 0 ? 'Free' : `₹${shippingFee}`}</span>
            </div>
            {shippingFee > 0 && (
              <p className="text-xs text-gold">Add ₹{(999 - cartTotal).toLocaleString('en-IN')} more for free shipping</p>
            )}
          </div>
          <div className="flex justify-between font-bold text-parchment text-base border-t border-surface-border pt-3 mb-5">
            <span>Total</span>
            <span>₹{finalTotal.toLocaleString('en-IN')}</span>
          </div>
          <button onClick={() => navigate('/checkout')} className="btn-primary w-full !py-3">
            Proceed to Checkout
          </button>
          <Link to="/products" className="block text-center text-sm text-gold font-medium mt-4 hover:underline">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Cart
