import React from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'

const Footer = () => {
  return (
    <>
    <div className="md:hidden bg-base border-t border-surface-border text-silver-dim text-center py-4 text-xs mt-16">
      © {new Date().getFullYear()} Shivora. All rights reserved.
    </div>
    <footer className="bg-base border-t border-surface-border text-silver mt-16 hidden md:block">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="mb-3">
            <Logo />
          </div>
          <p className="text-sm text-silver-muted leading-relaxed">
            Your premium destination for curated products — delivered with care.
          </p>
        </div>
        <div>
          <h4 className="text-parchment font-semibold mb-3 text-sm uppercase tracking-wide">Shop</h4>
          <ul className="space-y-2 text-sm text-silver-muted">
            <li><Link to="/products" className="hover:text-gold transition-colors">All Products</Link></li>
            <li><Link to="/products?sort=newest" className="hover:text-gold transition-colors">New Arrivals</Link></li>
            <li><Link to="/wishlist" className="hover:text-gold transition-colors">Wishlist</Link></li>
            <li><Link to="/cart" className="hover:text-gold transition-colors">Cart</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-parchment font-semibold mb-3 text-sm uppercase tracking-wide">Account</h4>
          <ul className="space-y-2 text-sm text-silver-muted">
            <li><Link to="/profile" className="hover:text-gold transition-colors">My Profile</Link></li>
            <li><Link to="/orders" className="hover:text-gold transition-colors">Order History</Link></li>
            <li><Link to="/login" className="hover:text-gold transition-colors">Login</Link></li>
            <li><Link to="/register" className="hover:text-gold transition-colors">Register</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-parchment font-semibold mb-3 text-sm uppercase tracking-wide">Contact</h4>
          <ul className="space-y-2 text-sm text-silver-muted">
            <li>support@shivora.com</li>
            <li>Bengaluru, Karnataka, India</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-surface-border py-4 text-center text-xs text-silver-dim">
        © {new Date().getFullYear()} Shivora. All rights reserved.
      </div>
    </footer>
    </>
  )
}

export default Footer
