<!-- LOGIN MODAL -->
            <div class="modal login-modal fixed inset-0 bg-black/70 hidden items-center justify-center z-50">

                <div
                    class="modal-content bg-[#1c1c1c] text-white w-[380px] p-8 rounded-xl border border-white/20 relative">

                    <!-- CLOSE -->
                    <button class="close-modal absolute right-4 top-4 text-gray-400 hover:text-white">
                        <i class="bi bi-x-lg"></i>
                    </button>

                    <h2 class="text-2xl font-semibold mb-6 text-center">Login</h2>

                    <form class="flex flex-col gap-4">

                        <div>
                            <label class="text-sm">Email</label>
                            <input type="email"
                                class="w-full mt-1 bg-transparent border border-white/30 rounded-lg px-4 py-2 outline-none">
                        </div>

                        <div class="relative">

                            <label class="text-sm">Password</label>

                            <input type="password"
                                class="password-input w-full mt-1 bg-transparent border border-white/30 rounded-lg px-4 py-2 outline-none">

                            <i
                                class="toggle-password bi bi-eye absolute right-3 top-[38px] cursor-pointer text-gray-400"></i>

                        </div>

                        <div class="text-right text-sm">
                            <a href="#" class="text-gray-400 hover:text-white">
                                Forgot password?
                            </a>
                        </div>

                        <button class="bg-white text-black py-2 rounded-lg font-semibold hover:bg-gray-300">
                            Login
                        </button>

                    </form>

                    <p class="text-center text-sm mt-6 text-gray-400">
                        Don't have an account?
                        <a href="#" class="text-white hover:underline">Sign up</a>
                    </p>

                </div>
            </div>



            <!-- SIGNUP MODAL -->
            <!-- <div class="modal signup-modal fixed inset-0 bg-black/70 hidden items-center justify-center z-50">

<div class="modal-content bg-[#1c1c1c] text-white w-[380px] p-8 rounded-xl border border-white/20 relative">

<button class="close-modal absolute right-4 top-4 text-gray-400 hover:text-white">
<i class="bi bi-x-lg"></i>
</button>

<h2 class="text-2xl font-semibold mb-6 text-center">Sign Up</h2>

<form class="flex flex-col gap-4">

<input type="text" placeholder="Full name"
class="bg-transparent border border-white/30 rounded-lg px-4 py-2 outline-none">

<input type="email" placeholder="Email"
class="bg-transparent border border-white/30 rounded-lg px-4 py-2 outline-none">

<div class="relative">

<input type="password"
placeholder="Password"
class="password-input bg-transparent border border-white/30 rounded-lg px-4 py-2 outline-none w-full">

<i class="toggle-password bi bi-eye absolute right-3 top-3 cursor-pointer text-gray-400"></i>

</div>

<button class="bg-white text-black py-2 rounded-lg font-semibold hover:bg-gray-300">
Create Account
</button>

</form>

<p class="text-center text-sm mt-6 text-gray-400">
Already have an account?
<a href="#" class="text-white hover:underline">Login</a>
</p>

</div>
</div> -->
