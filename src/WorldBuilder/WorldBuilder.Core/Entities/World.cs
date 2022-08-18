using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WorldBuilder.Core.Entities
{
    public class World
    {
        public World()
        {
            Id = Guid.NewGuid();
        }
        public Guid Id { get; set; }
        public string Nickname { get; set; }


        public List<Contributor> Contributors { get; set; }

    }
}