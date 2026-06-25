import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getAddresses, deleteAddress, setDefaultAddress } from '../api/addressApi'
import AddressFormModal from '../components/AddressFormModal'
import Loader from '../components/common/Loader'
import ErrorAlert from '../components/common/ErrorAlert'

const AddressBook = () => {
  const [addresses, setAddresses]           = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')
  // undefined = modal closed | null = add new | object = edit existing
  const [modalAddress, setModalAddress]     = useState(undefined)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deletingId, setDeletingId]         = useState(null)
  const [settingDefaultId, setSettingDefaultId] = useState(null)

  const loadAddresses = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAddresses()
      setAddresses(res.data.addresses)
    } catch {
      setError('Could not load your addresses.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAddresses() }, [])

  const handleSetDefault = async (id) => {
    setSettingDefaultId(id)
    try {
      await setDefaultAddress(id)
      toast.success('Default address updated')
      loadAddresses()
    } catch {
      toast.error('Could not update default address')
    } finally {
      setSettingDefaultId(null)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteAddress(id)
      toast.success('Address deleted')
      setConfirmDeleteId(null)
      loadAddresses()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete address')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <Loader fullScreen label="Loading addresses..." />

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 sm:py-8">

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gold">My Addresses</h1>
        <button
          onClick={() => setModalAddress(null)}
          className="btn border border-gold text-gold hover:bg-gold/10 transition-colors !px-5"
        >
          + Add New Address
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadAddresses} />}

      {/* Empty state */}
      {addresses.length === 0 ? (
        <div className="text-center py-8 sm:py-16">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gold/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-parchment mb-2">No saved addresses</h2>
          <p className="text-silver-muted mb-6">Add an address to speed up checkout.</p>
          <button onClick={() => setModalAddress(null)} className="btn-primary !px-6">
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="card p-4 flex flex-col gap-3">

              {/* Name + DEFAULT badge */}
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-parchment">{addr.full_name}</p>
                {addr.is_default && (
                  <span className="flex-shrink-0 inline-flex items-center bg-gold text-[#14130F] text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-widest">
                    Default
                  </span>
                )}
              </div>

              {/* Address block */}
              <div className="text-sm text-silver-muted space-y-0.5">
                <p>{addr.phone}</p>
                <p>{addr.address_line1}</p>
                {addr.address_line2 && <p>{addr.address_line2}</p>}
                <p>{addr.city}, {addr.state} — {addr.pincode}</p>
              </div>

              {/* Actions row — switches to inline confirm on delete click */}
              {confirmDeleteId === addr.id ? (
                <div className="flex items-center gap-3 pt-2 border-t border-surface-border">
                  <span className="text-xs text-silver-muted flex-1">Remove this address?</span>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={deletingId === addr.id}
                    className="text-xs font-semibold text-red-400 hover:underline disabled:opacity-50"
                  >
                    {deletingId === addr.id ? 'Deleting…' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs font-semibold text-silver-muted hover:text-parchment hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4 pt-2 border-t border-surface-border text-xs font-semibold">
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      disabled={settingDefaultId === addr.id}
                      className="text-gold hover:underline disabled:opacity-50"
                    >
                      {settingDefaultId === addr.id ? 'Updating…' : 'Set as Default'}
                    </button>
                  )}
                  <button
                    onClick={() => { setConfirmDeleteId(null); setModalAddress(addr) }}
                    className="text-silver-muted hover:text-parchment hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(addr.id)}
                    className="text-red-400 hover:underline ml-auto"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {modalAddress !== undefined && (
        <AddressFormModal
          address={modalAddress}
          onClose={() => setModalAddress(undefined)}
          onSaved={() => { setModalAddress(undefined); loadAddresses() }}
        />
      )}
    </div>
  )
}

export default AddressBook
