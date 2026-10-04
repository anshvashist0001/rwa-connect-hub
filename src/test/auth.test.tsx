import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/admin/Login';
import { fireEvent } from '@testing-library/react';
vi.mock('@/lib/api',()=>({authApi:{me:vi.fn(),login:vi.fn()}}));
import { authApi } from '@/lib/api';

beforeEach(()=>{ localStorage.clear(); vi.stubEnv('VITE_DEMO_MODE','false'); vi.resetAllMocks(); });
afterEach(()=>{ cleanup(); vi.unstubAllEnvs(); });

function route() {
  return render(<MemoryRouter initialEntries={['/admin']}><Routes>
    <Route path="/admin" element={<ProtectedRoute><p>Protected content</p></ProtectedRoute>}/>
    <Route path="/admin/login" element={<p>Login required</p>}/>
  </Routes></MemoryRouter>);
}

describe('admin access',()=>{
  it('rejects a saved demo token when demo mode is disabled',async()=>{
    localStorage.setItem('rwa_admin_token','demo-token'); route();
    expect(await screen.findByText('Login required')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });
  it('validates real tokens with the backend',async()=>{
    localStorage.setItem('rwa_admin_token','expired'); vi.mocked(authApi.me).mockRejectedValue(new Error('401'));
    route(); expect(await screen.findByText('Login required')).toBeInTheDocument();
    expect(localStorage.getItem('rwa_admin_token')).toBeNull();
  });
  it('does not fall back to demo credentials after an API failure',async()=>{
    vi.mocked(authApi.login).mockRejectedValue(new Error('Unavailable'));
    render(<MemoryRouter><Login/></MemoryRouter>);
    fireEvent.change(screen.getByPlaceholderText('admin'),{target:{value:'admin'}});
    fireEvent.change(screen.getByPlaceholderText('••••••••'),{target:{value:'admin123'}});
    fireEvent.click(screen.getByRole('button',{name:'Sign In'}));
    await waitFor(()=>expect(screen.getByText(/Sign-in failed/)).toBeInTheDocument());
    expect(localStorage.getItem('rwa_admin_token')).toBeNull();
  });
});
