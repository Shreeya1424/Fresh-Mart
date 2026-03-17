import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import toast from 'react-hot-toast';

const MySwal = withReactContent(Swal);

export const showToast = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  loading: (message) => toast.loading(message),
  dismiss: (id) => toast.dismiss(id),
};

export const showConfirm = async (title, text, icon = 'warning') => {
  const result = await MySwal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes',
    cancelButtonText: 'Cancel',
    customClass: {
      popup: 'rounded-2xl shadow-soft border border-gray-200',
      confirmButton: 'btn-primary px-6 py-2 rounded-lg ml-2',
      cancelButton: 'btn-secondary px-6 py-2 rounded-lg'
    }
  });
  return result.isConfirmed;
};

export const showAlert = (title, text, icon = 'info') => {
  return MySwal.fire({
    title,
    text,
    icon,
    confirmButtonColor: '#3085d6',
    customClass: {
      popup: 'rounded-2xl shadow-soft border border-gray-200',
      confirmButton: 'btn-primary px-6 py-2 rounded-lg'
    }
  });
};
