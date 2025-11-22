import { Link } from 'react-router-dom'
import { Leaf, BookOpen, Users, Heart, Trophy, ArrowRight } from 'lucide-react'

export default function Landing() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-xl">
                            <Leaf className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6">
                        Welcome to <span className="text-primary-600">EcoSphere</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        An interactive environmental action platform for students to learn, collaborate, and advocate for sustainability through gamified activities and community engagement.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/signup"
                            className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                        >
                            <span>Get Started</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            to="/login"
                            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-primary-600 font-semibold rounded-lg border-2 border-primary-600 transition-all"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
                    Explore Our Features
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {/* EcoLearn */}
                    <Link to="/ecolearn" className="group">
                        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-2">
                            <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                                <BookOpen className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">EcoLearn</h3>
                            <p className="text-gray-600">
                                Read environmental articles and expand your knowledge on sustainability topics.
                            </p>
                        </div>
                    </Link>

                    {/* CollabSpace */}
                    <Link to="/collabspace" className="group">
                        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-2">
                            <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                                <Users className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">CollabSpace</h3>
                            <p className="text-gray-600">
                                Share ideas, participate in polls, and collaborate on environmental solutions.
                            </p>
                        </div>
                    </Link>

                    {/* ActiVista */}
                    <Link to="/activista" className="group">
                        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-2">
                            <div className="w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                                <Heart className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">ActiVista</h3>
                            <p className="text-gray-600">
                                Create advocacy posts, digital pledges, and campaign materials for change.
                            </p>
                        </div>
                    </Link>

                    {/* EcoQuest */}
                    <div className="group cursor-pointer">
                        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-2">
                            <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                                <Trophy className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">EcoQuest</h3>
                            <p className="text-gray-600">
                                Complete activities, earn points, and redeem rewards for your environmental efforts.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="bg-primary-600 text-white py-12 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-6">About EcoSphere</h2>
                        <p className="text-lg sm:text-xl text-primary-100 mb-8">
                            EcoSphere is a comprehensive platform designed to empower students and young environmental advocates.
                            Through interactive learning, collaborative problem-solving, and actionable advocacy, we're building
                            a community committed to creating positive environmental change.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-12">
                            <div>
                                <div className="text-4xl sm:text-5xl font-bold mb-2">100+</div>
                                <div className="text-primary-200">Activities</div>
                            </div>
                            <div>
                                <div className="text-4xl sm:text-5xl font-bold mb-2">1000+</div>
                                <div className="text-primary-200">Students</div>
                            </div>
                            <div>
                                <div className="text-4xl sm:text-5xl font-bold mb-2">50+</div>
                                <div className="text-primary-200">Articles</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl shadow-2xl p-8 sm:p-12 text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                        Ready to Make a Difference?
                    </h2>
                    <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                        Join thousands of students taking action for the environment. Start your journey today!
                    </p>
                    <Link
                        to="/signup"
                        className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg shadow-lg hover:bg-gray-50 transition-all transform hover:scale-105"
                    >
                        <span>Join EcoSphere Now</span>
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p>&copy; {new Date().getFullYear()} EcoSphere. All rights reserved.</p>
                    <p className="mt-2 text-sm">Empowering students to create environmental change.</p>
                </div>
            </footer>
        </div>
    )
}
