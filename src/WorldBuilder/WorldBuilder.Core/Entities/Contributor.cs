using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WorldBuilder.Core.Entities
{
    public class Contributor
    {
        public Contributor()
        {
            Id = Guid.NewGuid();
        }
        public Guid Id { get; set; }

        public virtual User User { get; set; }
        public Guid UserId { get; set; }

    }
}
