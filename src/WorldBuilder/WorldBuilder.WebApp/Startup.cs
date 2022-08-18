using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(WorldBuilder.WebApp.Startup))]
namespace WorldBuilder.WebApp
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
